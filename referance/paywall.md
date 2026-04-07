## 🔧 BÖLÜM C — REVENUECAT ENTEGRASYONU

### C1 · SDK Kurulumu

```bash
# 1. SDK'yı yükle
npm install --save react-native-purchases react-native-purchases-ui

# 2. iOS için pod'ları yükle
cd ios && pod install && cd ..

# 3. Android için herhangi ek adım gerekmez (otomatik link)
```

**iOS Info.plist** — StoreKit izinleri için gerekmez ama `NSUserTrackingUsageDescription` eklenebilir.

**Android build.gradle** — minSdkVersion 24+ olmalı.

---

### C2 · SDK Yapılandırması

```typescript
// services/RevenueCatService.ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ API Anahtarları
const API_KEYS = {
  ios: 'appl_kjhwQGJELRufkdnNhOJykEFLAdd',
  android: 'goog_XXXXXXXXXXXXXXXX', // Android anahtarını buraya ekle
};

let isConfigured = false;

export async function configureRevenueCat(userId?: string) {
  if (isConfigured) return;

  // Geliştirme modunda logları aç
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

  await Purchases.configure({
    apiKey,
    appUserID: userId ?? null, // null = anonim kullanıcı
    usesStoreKit2IfAvailable: true, // iOS 15+ için StoreKit 2
  });

  isConfigured = true;
  console.log('RevenueCat yapılandırıldı ✅');
}

// Kullanıcı giriş yaptıktan sonra çağır
export async function loginRevenueCat(userId: string) {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (e) {
    console.error('RevenueCat login hatası:', e);
    return null;
  }
}

// Kullanıcı çıkış yaptıktan sonra çağır
export async function logoutRevenueCat() {
  try {
    const customerInfo = await Purchases.logOut();
    return customerInfo;
  } catch (e) {
    console.error('RevenueCat logout hatası:', e);
    return null;
  }
}
```

**App.tsx'e ekle:**

```typescript
// App.tsx
import { configureRevenueCat } from './services/RevenueCatService';

export default function App() {
  useEffect(() => {
    configureRevenueCat();
  }, []);

  return <RootNavigator />;
}
```

---

### C3–C5 · Satın Alma, Restore ve Entitlement Yönetimi

```typescript
// hooks/usePremium.ts
import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_ENTITLEMENT = 'premium';
const CACHE_KEY = '@is_premium';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 saat

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const checkPremiumStatus = useCallback(async (info?: CustomerInfo) => {
    try {
      const resolvedInfo = info ?? await Purchases.getCustomerInfo();
      setCustomerInfo(resolvedInfo);

      const active = resolvedInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
      setIsPremium(active);

      // AsyncStorage'a önbelleğe al
      await AsyncStorage.setItem(CACHE_KEY, active ? 'true' : 'false');
      await AsyncStorage.setItem('@premium_cache_time', Date.now().toString());
    } catch (e) {
      console.error('Premium kontrol hatası:', e);
      // Önbellekten oku
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      setIsPremium(cached === 'true');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Önce önbelleği göster, sonra sunucudan güncelle
    (async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      const cacheTime = await AsyncStorage.getItem('@premium_cache_time');
      const isStale = !cacheTime || (Date.now() - parseInt(cacheTime)) > CACHE_TTL;

      if (cached !== null) {
        setIsPremium(cached === 'true');
        if (!isStale) {
          setIsLoading(false);
          return;
        }
      }

      await checkPremiumStatus();
    })();

    // CustomerInfo değişikliklerini dinle (iptal, yenileme vb.)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      checkPremiumStatus(info);
    });

    return () => listener.remove();
  }, [checkPremiumStatus]);

  return { isPremium, isLoading, customerInfo, checkPremiumStatus };
}
```

---

### C8 · Profil/Ayarlar Sayfasında Pro Etiketi + Upgrade Butonu

```typescript
// screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePremium } from '../hooks/usePremium';

export default function ProfileScreen({ navigation }: any) {
  const { isPremium, isLoading } = usePremium();

  return (
    <View style={styles.container}>
      {/* Kullanıcı Başlığı */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </View>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>Kullanıcı Adı</Text>
            {!isLoading && isPremium && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>✨ PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>kullanici@email.com</Text>
        </View>
      </View>

      {/* Upgrade Butonu — sadece pro olmayanlara göster */}
      {!isLoading && !isPremium && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Paywall', { fromOnboarding: false })}
        >
          <Text style={styles.upgradeButtonText}>⚡ Pro'ya Geç</Text>
        </TouchableOpacity>
      )}

      {/* Pro kullanıcılar için abonelik bilgisi */}
      {!isLoading && isPremium && (
        <View style={styles.proInfoCard}>
          <Text style={styles.proInfoText}>✅ Aktif WorldPulse Pro Üyesisiniz</Text>
          <Text style={styles.proInfoSubText}>Aboneliği iPhone Ayarlar → Apple ID menüsünden yönetebilirsiniz.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  proBadge: {
    backgroundColor: '#6C63FF', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  userEmail: { color: '#666', fontSize: 14, marginTop: 2 },
  upgradeButton: {
    backgroundColor: '#6C63FF', borderRadius: 16,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  proInfoCard: {
    backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
    padding: 16, marginTop: 8,
  },
  proInfoText: { color: '#6C63FF', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  proInfoSubText: { color: '#888', fontSize: 13, lineHeight: 18 },
});
```
# Paywall + RevenueCat Referansı

Production-ready paywall modal implementasyonu.

---

## Genel Yapı

```typescript
// PaywallModal props:
interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

// PlanItem:
interface PlanItem {
  id: string;                // 'weekly' | 'monthly' | 'yearly'
  title: string;
  price: string;             // RC'den priceString, yoksa fallback
  period: string;            // "/hafta", "/ay", "/yıl"
  savings?: string;          // "Save 79%" — yalnız yearly için
  isBestValue?: boolean;     // yearly → true
  package?: any;             // RC PurchasesPackage objesi
}
```

---

## RevenueCat Entegrasyonu

### loadOfferings()

```typescript
const loadOfferings = async () => {
  setIsLoading(true);
  const offerings = await RevenueCatService.getOfferings();
  if (offerings) {
    const availablePlans: PlanItem[] = [];
    
    if (offerings.weekly) availablePlans.push({
      id: 'weekly', title: t('paywall.weekly'),
      price: offerings.weekly.product.priceString,
      period: t('paywall.per_week'),
      package: offerings.weekly
    });
    
    if (offerings.monthly) availablePlans.push({
      id: 'monthly', title: t('paywall.monthly'),
      price: offerings.monthly.product.priceString,
      period: t('paywall.per_month'),
      package: offerings.monthly
    });
    
    if (offerings.annual) availablePlans.push({
      id: 'yearly', title: t('paywall.yearly'),
      price: offerings.annual.product.priceString,
      period: t('paywall.per_year'),
      savings: t('paywall.best_value'),
      isBestValue: true,
      package: offerings.annual
    });

    if (availablePlans.length > 0) setPlans(availablePlans);
  }
  setIsLoading(false);
};
```

### Satın Alma

```typescript
const handleSubscribe = async () => {
  const plan = plans.find(p => p.id === selectedPlanId);
  
  // DEV MODE: RC olmadan test
  if (!plan?.package && __DEV__) {
    setIsPurchasing(true);
    setTimeout(() => {
      setPremium(true, selectedPlanId);
      setIsPurchasing(false);
      onClose();
    }, 1500);
    return;
  }
  
  if (!plan?.package) {
    Alert.alert(t('common.error'), t('paywall.package_not_found'));
    return;
  }

  setIsPurchasing(true);
  try {
    const success = await RevenueCatService.purchasePackage(plan.package);
    if (success) {
      Alert.alert(t('common.success'), t('paywall.welcome_pro_title'), [
        { text: t('paywall.start_exploring'), onPress: onClose }
      ]);
    }
  } catch (e: any) {
    if (!e.userCancelled) {
      Alert.alert(t('common.error'), e.message || t('common.error'));
    }
  } finally {
    setIsPurchasing(false);
  }
};
```

### Restore

```typescript
const handleRestore = async () => {
  setIsPurchasing(true);
  try {
    const success = await RevenueCatService.restorePurchases();
    if (success) {
      Alert.alert(t('common.success'), t('profile.restored_success'), [
        { text: t('common.ok'), onPress: onClose }
      ]);
    } else {
      Alert.alert(t('profile.restore_complete'), t('paywall.no_subscription_found'));
    }
  } catch (e: any) {
    Alert.alert(t('common.error'), e.message || t('common.error'));
  } finally {
    setIsPurchasing(false);
  }
};
```

---

## UX Kuralları

### showClose — 7 Saniye Kuralı (FTC/Apple Uyumluluk)
```typescript
useEffect(() => {
  if (visible) {
    setShowClose(false);
    loadOfferings();
    const timer = setTimeout(() => setShowClose(true), 7000);
    return () => clearTimeout(timer);
  }
}, [visible]);

// Header:
{showClose ? (
  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
    <X size={24} color={Colors.text} />
  </TouchableOpacity>
) : (
  <View style={[styles.closeButton, { width: 40, height: 40 }]} />  // placeholder
)}
```

### Yearly Default Seçim
```typescript
const [selectedPlanId, setSelectedPlanId] = useState('yearly');
// Yearly her zaman default seçili → dönüşümü artırır
```

### Yearly için Trial Disclaimer
```typescript
{selectedPlanId === 'yearly' && (
  <Text style={styles.disclaimer}>
    {t('paywall.trial_disclaimer')}
    {/* "3 günlük ücretsiz deneme. Deneme süresi sonunda otomatik yenilenir." */}
  </Text>
)}
```

### CTA Butonu Metni
```typescript
// Yearly seçiliyse:
selectedPlanId === 'yearly' ? t('common.start_free_trial') : t('common.continue')
```

---

## Plan Kartı Tasarımı

```
┌─────────────────────────────────────────┐
│ [BEST VALUE badge] ← sadece yearly'de   │
│                                         │
│  Yıllık          ◯ ← radio             │
│  $4.99/yıl       ● ← seçilince dolu    │
│                                         │
│  %79 tasarruf ← savings text           │
└─────────────────────────────────────────┘

Seçili kart: borderColor = Colors.primary
Best value kart: borderColor = Colors.premium (altın/turuncu)
```

**Plan kartı sırası:** weekly → monthly → yearly (yukarıdan aşağı)

---

## Benefits Listesi

```typescript
const benefits = useMemo(() => [
  t('paywall.benefit_1'),  // Ana özellik
  t('paywall.benefit_2'),
  t('paywall.benefit_3'),
  t('paywall.benefit_4'),
  t('paywall.benefit_5'),
  t('paywall.benefit_6'),  // "Reklamsız deneyim" / "Su damgası yok"
], [t]);

// Her benefit: checkCircle (primary renk, %20 opacity bg) + text
```

---

## Footer Linkleri (App Store Zorunluluğu)

```typescript
<View style={styles.legalLinks}>
  <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
    <Text>{t('common.privacy_policy')}</Text>
  </TouchableOpacity>
  <Text>|</Text>
  <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
    <Text>{t('common.terms_of_use')}</Text>
  </TouchableOpacity>
</View>
```

**Bu linkler App Store review için ZORUNLU.**

---

## i18n Key Listesi (paywall namespace)

```json
{
  "paywall": {
    "title": "Premium'a Geç",
    "weekly": "Haftalık",
    "monthly": "Aylık",
    "yearly": "Yıllık",
    "per_week": "/hafta",
    "per_month": "/ay",
    "per_year": "/yıl",
    "best_value": "En İyi Değer",
    "trial_disclaimer": "3 günlük ücretsiz deneme. İptal etmezseniz otomatik yenilenir.",
    "restore_purchases": "Satın Almaları Geri Yükle",
    "no_subscription_found": "Aktif abonelik bulunamadı.",
    "welcome_pro_title": "Hoş geldin, Premium!",
    "start_exploring": "Keşfetmeye Başla",
    "package_not_found": "Paket bulunamadı.",
    "benefit_1": "✅ Ana özellik",
    "benefit_2": "✅ İkinci özellik",
    "benefit_3": "✅ Üçüncü özellik",
    "benefit_4": "✅ Sınırsız kullanım",
    "benefit_5": "✅ Su damgası yok",
    "benefit_6": "✅ Öncelikli destek"
  }
}
```

---

## Tablet Desteği (useResponsive hook)

```typescript
const { isTablet } = useResponsive();

// Tablet'te: maxWidth: 680, alignSelf: 'center'
// Font boyutları +4-6px büyür
// Padding/margin %20-30 artar
// İkon boyutları büyür (24 → 32)
```

---

## onboarding.tsx'te Paywall Entegrasyonu

```typescript
// phase === 'premiumIntro' durumunda:
if (phase === 'premiumIntro') {
  return (
    <>
      <PremiumIntroScreen onContinue={() => setShowPaywall(true)} />
      <PaywallModal visible={showPaywall} onClose={handlePaywallClose} />
    </>
  );
}

// PaywallModal kapandığında onboarding tamamla:
const handlePaywallClose = () => {
  setShowPaywall(false);
  completeOnboarding({ ...answers, petName });
  router.replace('/(tabs)/home');  // Ana ekrana geç
};
```

---

## Fallback Plan Değerleri

RC yüklenemezse görüntülenen varsayılan değerler:
```typescript
const [plans, setPlans] = useState<PlanItem[]>([
  { id: 'weekly',  title: t('paywall.weekly'),  price: '$0.99', period: t('paywall.per_week') },
  { id: 'monthly', title: t('paywall.monthly'), price: '$1.99', period: t('paywall.per_month') },
  { id: 'yearly',  title: t('paywall.yearly'),  price: '$4.99', period: t('paywall.per_year'),
    savings: 'Save 79%', isBestValue: true },
]);
// RC başarıyla yüklendikten sonra gerçek fiyatlarla override edilir
```
---

## ✅ DOĞRULAMA KONTROL LİSTESİ

Her bölümü tamamladıktan sonra şu testleri yap:

### Onboarding Testleri
```
[ ] 10 ekranın hepsi Continue ile ilerliyor
[ ] Soru ekranlarında seçim yapılmadan Continue çalışmıyor
[ ] Tanıtım ekranlarında Continue direkt çalışıyor
[ ] "Atla" butonu ilk 5 ekranda görünüyor, sonra kaybolıyor
[ ] Progress bar 10 adımı doğru gösteriyor
[ ] 11. ekranda Paywall açılıyor
[ ] AsyncStorage'a @onboarding_answers kaydediliyor
[ ] Uygulamayı kapatıp açınca Onboarding tekrar gösterilmiyor (tamamlandıysa)
```

### Paywall Testleri
```
[ ] X butonu görünür ve baskıya tepki veriyor
[ ] X'e basınca Ana sayfaya gidiyor
[ ] 3 plan kart görünüyor (Weekly / Monthly / Yearly)
[ ] Plan seçimi çalışıyor (radio button)
[ ] Fiyatlar RevenueCat'ten doğru yükleniyor
[ ] "3 Gün Ücretsiz Dene" butonu tıklanabiliyor
[ ] Yükleme sırasında spinner görünüyor
[ ] Satın alma başarılı → Ana sayfaya yönlendiriyor
[ ] Satın alma iptal → Hata yoksa sessizce duruyor
[ ] "Restore Purchase" çalışıyor
[ ] Privacy / Terms bağlantıları açılıyor
```

### RevenueCat Testleri
```
[ ] Sandbox ortamında test satın alımı yapılabiliyor
[ ] Entitlement "premium" aktif oluyor
[ ] Profil sayfasında PRO etiketi görünüyor
[ ] Upgrade butonu sadece free kullanıcılara görünüyor
[ ] CustomerInfo listener değişiklikleri yakalıyor
[ ] AsyncStorage önbelleklemesi çalışıyor
[ ] Abonelik iptali → Free'ye düşme simüle ediliyor (sandbox)
[ ] Restore purchase → Aktif abonelik geri yükleniyor
```

---

## 🔑 Önemli Notlar

| Konu | Değer |
|------|-------|
| RevenueCat iOS API Key | `appl_kjhwQGJELRufkdnNhOJykEFLAdd` |
| RevenueCat Secret Key | `sk_FXEOxgCcVWoiKhEjARIUwNonOPlKV` |
| Entitlement ID | `premium` |
| Weekly identifier | `weekly` / `com.worldpulse.mobile.weekly` |
| Monthly identifier | `monthly` / `com.worldpulse.mobile.monthly` |
| Yearly identifier | `yearly` / `com.worldpulse.mobile.yearly` |

> ⚠️ **Güvenlik:** Secret Key (`sk_`) hiçbir zaman istemci koduna eklenmemeli. Sadece sunucu tarafında kullanılmalıdır.

### Sandbox Test Adımları
1. Xcode → Simülatör veya fiziksel cihaz
2. Ayarlar → App Store → Sandbox hesabı ekle
3. Uygulamayı aç → Paywall'a git → Test satın alma yap
4. RevenueCat Dashboard → Sandbox sekmesinden kontrol et

### Üyelik İptali Akışı
RevenueCat'teki `CustomerInfo` dinleyicisi, kullanıcı aboneliğini iptal ettiğinde otomatik tetiklenir. `entitlements.active['premium']` boş geldiğinde uygulama free moduna geçer. `@is_premium` AsyncStorage anahtarı da güncellenir.

---

*Bu skill WorldPulse uygulaması için hazırlanmıştır. Onboarding ekran sayısı, soru içerikleri ve renk paleti değiştirilebilir.*



@beautifulMention skill i18n ve localization eekle.lütfen localizasyon onayı iste ve bu onay geldikten sonra. anla ve 10 dilde o dilde uygulamayı kullanmaya devam et ..eğer bu dillerden biri değilse ingilizce değevam et... uygulama açıldıktan sonra async ile de bu localizasyon şeklinde çek..