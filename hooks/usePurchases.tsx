import { create } from 'zustand';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_KEYS = {
  ios: 'appl_tkEpUIpkgBemXuHGsWcsQgROLSj',
  android: 'goog_XXXXXXXXXXXXXXXXXXXXXXXX', // TODO: RevenueCat dashboard'dan Android key'i girin
};

// Fallback prices shown when RevenueCat can't load (wrong key, no network, etc.)
// These are display-only — actual purchase goes through RevenueCat
const FALLBACK_PACKAGES: PurchasesPackage[] = [
  { identifier: 'weekly', packageType: 'WEEKLY', product: { priceString: '$0.99', identifier: 'weekly' } } as unknown as PurchasesPackage,
  { identifier: 'monthly', packageType: 'MONTHLY', product: { priceString: '$4.99', identifier: 'monthly' } } as unknown as PurchasesPackage,
  { identifier: 'annual', packageType: 'ANNUAL', product: { priceString: '$29.99', identifier: 'annual' } } as unknown as PurchasesPackage,
];

let isRevenueCatConfigured = false;
let listenerRemover: (() => void) | void | undefined;

const PREMIUM_CACHE_KEY = 'is_pro_cache';
const ENTITLEMENT_ID = 'premium';
const ONBOARDING_KEY = 'onboarding_complete';

interface PurchasesState {
  isPro: boolean;
  subscriptionPlan: 'annual' | 'monthly' | 'weekly' | null;
  isOnboardingComplete: boolean | null;
  packages: PurchasesPackage[];
  isLoading: boolean;
  activePresetId: string | null;

  initialize: () => Promise<void>;
  setOnboardingComplete: (status: boolean) => Promise<void>;
  showPaywall: (presetId?: string) => void;
  hidePaywall: () => void;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  simulateDevPurchase: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  setIsProOverride: (status: boolean | null) => Promise<void>;
}

export const usePurchases = create<PurchasesState>((set, get) => {
  const checkEntitlements = async (customerInfo: CustomerInfo) => {
    const override = await AsyncStorage.getItem('is_pro_override');
    if (override !== null) {
      const isOverridden = override === 'true';
      set({ isPro: isOverridden, subscriptionPlan: isOverridden ? 'annual' : null });
      return;
    }
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    set({ isPro: active });
    AsyncStorage.setItem(PREMIUM_CACHE_KEY, active ? 'true' : 'false').catch(() => { });

    if (active) {
      const subs = customerInfo.activeSubscriptions;
      if (subs.some(s => s.toLowerCase().includes('annual') || s.toLowerCase().includes('yearly'))) {
        set({ subscriptionPlan: 'annual' });
      } else if (subs.some(s => s.toLowerCase().includes('weekly'))) {
        set({ subscriptionPlan: 'weekly' });
      } else {
        set({ subscriptionPlan: 'monthly' });
      }
    } else {
      set({ subscriptionPlan: null });
    }
  };

  return {
    isPro: false,
    subscriptionPlan: null,
    isOnboardingComplete: null,
    packages: [],
    isLoading: true,
    activePresetId: null,

    initialize: async () => {
      if (listenerRemover) return; // Prevent double initialization

      try {
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_KEY);
        set({ isOnboardingComplete: onboardingStatus === 'true' });

        const override = await AsyncStorage.getItem('is_pro_override');
        if (override !== null) {
          const isOverridden = override === 'true';
          set({ isPro: isOverridden, subscriptionPlan: isOverridden ? 'annual' : null });
        } else {
          const cachedPro = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
          if (cachedPro === 'true') {
            set({ isPro: true, subscriptionPlan: 'annual' });
          }
        }
      } catch (e) {
        set({ isOnboardingComplete: false });
      }

      try {
        if (process.env.NODE_ENV === 'development') {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (!isRevenueCatConfigured) {
          Purchases.configure({
            apiKey: Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android,
          });
          isRevenueCatConfigured = true;
        }

        const customerInfo = await Purchases.getCustomerInfo();
        await checkEntitlements(customerInfo);

        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          set({ packages: offerings.current.availablePackages });
        }

        listenerRemover = Purchases.addCustomerInfoUpdateListener((info) => {
          checkEntitlements(info);
        });

      } catch (err) {
        console.error("Purchase Initialization Error (RevenueCat doesn't work in Expo Go!):", err);
        set({ packages: FALLBACK_PACKAGES });
      } finally {
        set({ isLoading: false });
      }
    },

    setOnboardingComplete: async (status: boolean) => {
      await AsyncStorage.setItem(ONBOARDING_KEY, status.toString());
      set({ isOnboardingComplete: status });
    },

    showPaywall: (presetId?: string) => {
      set({ activePresetId: presetId || null });
      router.push('/paywall');
    },

    hidePaywall: () => {
      set({ activePresetId: null });
      try {
        router.back();
      } catch {
        router.replace('/');
      }
    },

    simulateDevPurchase: async () => {
      set({ isLoading: true });
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      set({ isPro: true, subscriptionPlan: 'annual', isLoading: false });
      AsyncStorage.setItem(PREMIUM_CACHE_KEY, 'true').catch(() => { });
      get().hidePaywall();
    },

    purchasePackage: async (pkg: PurchasesPackage) => {
      try {
        set({ isLoading: true });
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        await checkEntitlements(customerInfo);
        if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
          get().hidePaywall();
        }
      } catch (err: any) {
        if (!err.userCancelled) {
          Alert.alert('Error', err.message);
        }
      } finally {
        set({ isLoading: false });
      }
    },

    restorePurchases: async () => {
      try {
        set({ isLoading: true });
        const customerInfo = await Purchases.restorePurchases();
        await checkEntitlements(customerInfo);
        if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
          Alert.alert('Restored', 'Your subscription was successfully restored.');
          get().hidePaywall();
        } else {
          Alert.alert('Info', 'No active subscription found.');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        set({ isLoading: false });
      }
    },

    setIsProOverride: async (status: boolean | null) => {
      if (status === null) {
        await AsyncStorage.removeItem('is_pro_override');
        const cached = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
        const isProCached = cached === 'true';
        set({ isPro: isProCached, subscriptionPlan: isProCached ? 'annual' : null });
      } else {
        await AsyncStorage.setItem('is_pro_override', status ? 'true' : 'false');
        set({ isPro: status, subscriptionPlan: status ? 'annual' : null });
      }
    },
  };
});
