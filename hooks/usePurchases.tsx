import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_KEYS = {
  ios: 'appl_tkEpUIpkgBemXuHGsWcsQgROLSj',
  android: 'goog_XXXXXXXXXXXXXXXXXXXXXXXX', // TODO: RevenueCat dashboard'dan Android key'i girin
};

let isRevenueCatConfigured = false;
const PREMIUM_CACHE_KEY = 'is_pro_cache';

const ENTITLEMENT_ID = 'premium';
const ONBOARDING_KEY = 'onboarding_complete';

interface PurchasesContextType {
  isPro: boolean;
  subscriptionPlan: 'annual' | 'monthly' | 'weekly' | null;
  isOnboardingComplete: boolean | null;
  setOnboardingComplete: (status: boolean) => Promise<void>;
  showPaywall: (presetId?: string) => void;
  hidePaywall: () => void;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  simulateDevPurchase: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  packages: PurchasesPackage[];
  isLoading: boolean;
  activePresetId: string | null;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(undefined);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'annual' | 'monthly' | 'weekly' | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkEntitlements = useCallback((customerInfo: CustomerInfo) => {
    const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    setIsPro(active);
    AsyncStorage.setItem(PREMIUM_CACHE_KEY, active ? 'true' : 'false').catch(() => { });

    // PR-1: aktif plan tipini belirle
    if (active) {
      const subs = customerInfo.activeSubscriptions;
      if (subs.some(s => s.toLowerCase().includes('annual') || s.toLowerCase().includes('yearly'))) {
        setSubscriptionPlan('annual');
      } else if (subs.some(s => s.toLowerCase().includes('weekly'))) {
        setSubscriptionPlan('weekly');
      } else {
        setSubscriptionPlan('monthly');
      }
    } else {
      setSubscriptionPlan(null);
    }
  }, []);

  useEffect(() => {
    // RC-3: listener cleanup için referans tut
    // Not: react-native-purchases bazı versiyonlarda void döner, bazılarında () => void
    let listenerRemover: (() => void) | void | undefined;

    const init = async () => {
      // 1. Önce Onboarding ve depolama durumunu bağımsız yükle (Hata olursa app donmasın)
      try {
        const onboardingStatus = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsOnboardingComplete(onboardingStatus === 'true');

        const cachedPro = await AsyncStorage.getItem(PREMIUM_CACHE_KEY);
        if (cachedPro === 'true') setIsPro(true);
      } catch (e) {
        setIsOnboardingComplete(false);
      }

      // 2. RevenueCat başlat (Expo Go uygulamasında NativeModule hatası verebilir, bunu yakala)
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
        checkEntitlements(customerInfo);

        // Offerings yükle
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }

        // RC-3: listener dönüşünü sakla — cleanup için
        listenerRemover = Purchases.addCustomerInfoUpdateListener((info) => {
          checkEntitlements(info);
        });

      } catch (err) {
        console.error("Purchase Initialization Error (RevenueCat doesn't work in Expo Go!):", err);
        // Fallback dummy packages for Expo Go (development only)
        if (__DEV__) {
          setPackages([
            { identifier: 'weekly', packageType: 'WEEKLY', product: { priceString: '$0.99' } } as unknown as PurchasesPackage,
            { identifier: 'monthly', packageType: 'MONTHLY', product: { priceString: '$1.99' } } as unknown as PurchasesPackage,
            { identifier: 'yearly_dummy', packageType: 'ANNUAL', product: { priceString: '$4.99' } } as unknown as PurchasesPackage,
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // RC-3: cleanup — memory leak önleme
    return () => {
      if (typeof listenerRemover === 'function') {
        listenerRemover();
      }
    };
  }, [checkEntitlements]);

  const setOnboardingComplete = async (status: boolean) => {
    await AsyncStorage.setItem(ONBOARDING_KEY, status.toString());
    setIsOnboardingComplete(status);
  };

  const showPaywall = useCallback((presetId?: string) => {
    setActivePresetId(presetId || null);
    router.push('/paywall');
  }, []);

  const hidePaywall = useCallback(() => {
    setActivePresetId(null);
    try {
      router.back();
    } catch {
      router.replace('/');
    }
  }, []);

  const simulateDevPurchase = useCallback(async () => {
    setIsLoading(true);
    await new Promise<void>(resolve => setTimeout(resolve, 1500));
    setIsPro(true);
    setSubscriptionPlan('annual');
    AsyncStorage.setItem(PREMIUM_CACHE_KEY, 'true').catch(() => { });
    setIsLoading(false);
    hidePaywall();
  }, [hidePaywall]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      checkEntitlements(customerInfo);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        hidePaywall();
      }
    } catch (err: any) {
      // PW-4: iptal edilince alert gösterme
      if (!err.userCancelled) {
        Alert.alert('Error', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [checkEntitlements, hidePaywall]);

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      checkEntitlements(customerInfo);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        Alert.alert('Restored', 'Your subscription was successfully restored.');
        hidePaywall();
      } else {
        Alert.alert('Info', 'No active subscription found.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [checkEntitlements, hidePaywall]);

  const value = useMemo(
    () => ({
      isPro,
      subscriptionPlan,
      // LY-2: null durumu korunuyor — layout'ta doğru kontrol yapılabilsin
      isOnboardingComplete,
      setOnboardingComplete,
      showPaywall,
      hidePaywall,
      purchasePackage,
      simulateDevPurchase,
      restorePurchases,
      packages,
      // isLoading: null iken de loading sayılır
      isLoading: isLoading || isOnboardingComplete === null,
      activePresetId,
    }),
    [isPro, subscriptionPlan, isOnboardingComplete, showPaywall, hidePaywall, purchasePackage, simulateDevPurchase, restorePurchases, packages, isLoading, activePresetId]
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
}
