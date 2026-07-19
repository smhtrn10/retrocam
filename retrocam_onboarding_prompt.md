
# RETROCAM — Y2K Vintage Camera App
## React Native (Expo) + RevenueCat Onboarding & Paywall Prompt

---
C:\Users\User\Desktop\retrocam\components\onboarding  eski onboarding dosyası buradan bilgileri alabilirsin gerekli.. 

birde uygulama C:\Users\User\Desktop\retrocam\i18n bulunan tüm dillere uygun olacak kullanıcı giriş yapınca localizasyona göre o dilede onboarding ve paywall sayfası çıkacak ... eğer kullanıcı bu aşağıdaki locallerden birinde değilse ingilizce geçecek..

bulunan diller aşağğıda
[text](i18n/locales/de.json) [text](i18n/locales/en.json) [text](i18n/locales/es.json) [text](i18n/locales/fr.json) [text](i18n/locales/it.json) [text](i18n/locales/ja.json) [text](i18n/locales/ko.json) [text](i18n/locales/pt.json) [text](i18n/locales/ru.json) [text](i18n/locales/tr.json)


bana modern animasyonlu ,realist görsel ve ikan kabileyiti yüksek onboardiing ve paywalla ihtiyacım var lütfen bana aşağıdaki tasarımı örnek alarak veya geliştirerek onboarding i18n uygun dillerde local edilmiş onboarding ver..

## PROJE BİLGİSİ

**Uygulama Adı:** RetroCam  
**Platform:** iOS (App Store US) + Android (Google Play)  
**Framework:** C:\Users\User\Desktop\retrocam\app.json
**Monetizasyon:** RevenueCat (Subscription + IAP)  
**Hedef Kitle:** Gen Z, TikTok/Instagram kullanıcıları, Y2K estetik sevenler  
**Mevcut Problem:** Day 1 Retention 3%, MRR $6, Conversion Rate 2.6%  
**Hedef:** Day 1 Retention 10%+, MRR $30+, Conversion Rate 5%+

---

## TAM ONBOARDING AKIŞI (7 EKRAN + HOME)

### EKRAN 1: SPLASH / LOGO (0.5 sn — sessiz geçiş)
- RetroCam logo (film tane overlay ile fade-in, 800ms)
- Arka plan: #0a0a0a (saf siyah)
- Film grain texture: opacity 0.04, repeating noise pattern
- Logo: "RetroCam" yazısı, SpaceGrotesk-Bold, 32px, #e8a87c
- Alt yazı: "Y2K Vintage Camera", Inter-Medium, 14px, rgba(245,240,232,0.6)
- Otomatik geçiş: 0.5 sn sonra Screen 2'ye fade
- Kullanıcı etkileşimi: Yok (dokununca hemen geç)

### EKRAN 2: HOOK / VALUE PROP (Ana Ekran)
**Başlık:** "1998'deki gibi çek"  
**Alt başlık:** "Anlık film tane, ışık sızıntısı ve Y2K tonları. Düzenleme yok, tek dokunuşla vintage estetik."  

**Görsel:** Before/After fotoğraf karşılaştırması
- Sol yarı: Normal fotoğraf (label: "Normal")
- Sağ yarı: Y2K filtresi uygulanmış (label: "Y2K")
- Üzerinde: Swipe oku (pulse animasyonlu)
- Fotoğraf: Gerçek kullanıcı fotoğrafı (mock data için Unsplash)

**Sosyal Kanıt Badge:** "🔥 TikTok'ta 2M+ kullanıcı"
- Background: rgba(232,168,124,0.15)
- Text: #e8a87c, 12px, font-weight 600
- Border-radius: 20px

**Buton:** "Keşfet →"
- Background: linear-gradient(135deg, #e8a87c, #d4a574)
- Text: #0a0a0a, 16px, font-weight 600
- Border-radius: 16px
- Padding: 16px 24px
- Full width
- Hover: translateY(-2px), box-shadow: 0 8px 24px rgba(232,168,124,0.3)

**Skip Button:** "Atla" (sağ üst köşe)
- Background: rgba(245,240,232,0.08)
- Border: 1px solid rgba(245,240,232,0.15)
- Text: rgba(245,240,232,0.5), 12px
- Border-radius: 20px
- Her ekranda sabit

**Progress Dots:** 5 adet (aktif olan genişletilmiş)
- Aktif: #e8a87c, width 24px, height 6px, border-radius 3px
- Pasif: rgba(245,240,232,0.2), width 6px, height 6px, border-radius 50%
- Geçiş: 400ms ease

**Animasyonlar:**
- Headline: FadeInUp, 600ms, delay 100ms
- Subheadline: FadeInUp, 600ms, delay 200ms
- Visual: FadeIn, 800ms, delay 400ms
- Badge: FadeInUp, 600ms, delay 0ms
- Button: FadeInUp, 600ms, delay 500ms
- Film grain overlay: Tüm ekran boyunca, opacity 0.04

**Geçiş Screen 2 → 3:** Light Leak Wipe
- Diagonal gradient sweep: warm amber (#e8a87c) → transparent
- Süre: 600ms
- Easing: easeInOut
- Direction: left → right

---

### EKRAN 3: FİLTRE SHOWCASE
**Başlık:** "4 ikonik film kamerası"  
**Alt başlık:** "Her biri gerçek film stoklarından esinlenerek tasarlandı. Kaydır ve dene."  

**Horizontal Carousel:** 4 kart
1. **Classic M** — "POPÜLER" badge
   - Warm, muted tones for portraits
   - Preview image: Sepia 0.3, contrast 0.9, brightness 1.05

2. **D Classic**
   - Crisp, faded early 2000s digital camera look
   - Preview: Contrast 1.1, saturate 0.8, brightness 1.1

3. **CCD R** — "Y2K" badge
   - Sharp, vibrant CCD sensor glow
   - Preview: Saturate 1.4, contrast 1.15, hue-rotate -5deg

4. **D Exp**
   - Experimental, pushed colors, dreamy overexposed
   - Preview: Contrast 1.2, saturate 1.3, brightness 1.15

**Kart Tasarımı:**
- Width: 140px, Height: 200px
- Border-radius: 16px
- Border: 2px solid transparent (selected: #e8a87c)
- Image: object-fit cover, full card
- Badge: top-left, background #e8a87c, text #0a0a0a, 10px, font-weight 700
- Name: bottom, gradient overlay (transparent → rgba(0,0,0,0.8)), 13px, font-weight 600
- Selected: translateY(-4px), border-color #e8a87c
- Auto-scroll: Yavaş, 1 tur, sonra dur

**Buton:** "Videoyu Gör →"
- Aynı tasarım (Screen 2 butonu)

**Geçiş Screen 3 → 4:** Shutter Click
- Scale: 1 → 0.95 → 1 (100ms)
- White flash overlay: opacity 0 → 0.9 → 0 (150ms)
- Easing: easeOut

---

### EKRAN 4: VİDEO / 8MM MODU
**Başlık:** "8mm film video modu"  
**Alt başlık:** "Videolarına otantik 8mm film tane, sıcak titreşim ve eski tarz tarama çizgileri ekle."  

**Video Preview:**
- Width: 100%, Height: 280px
- Border-radius: 16px
- Background: #1a1a2e
- Overlay: Scanline pattern (repeating-linear-gradient, 2px transparent, 2px rgba(0,0,0,0.15))
- Play button: center, 60px circle, background rgba(232,168,124,0.9), icon ▶
- Label: bottom-left, "▶ 8mm Demo", background rgba(0,0,0,0.7), 11px, font-weight 600

**Özellik İkonları:** 3 adet (horizontal row)
1. 🎞️ "8mm Tane"
2. ✨ "Işık Sızıntısı"
3. 📺 "VHS Tarama"
- Her biri: flex 1, text-align center, padding 12px
- Background: rgba(245,240,232,0.05)
- Border-radius: 12px
- Icon: 20px, Label: 12px, font-weight 600

**Buton:** "Galeriyi Gör →"

**Geçiş Screen 4 → 5:** VHS Glitch
- Horizontal RGB split: translateX(3px) → translateX(-3px) → translateX(2px) → translateX(-2px) → 0
- Hue-rotate: 20deg (400ms)
- Opacity: 0 → 1 → 0.8 → 1 → 0.6 → 0
- Süre: 400ms
- Easing: linear
- MAX 1 kez per flow (daha fazla rahatsız eder)

---

### EKRAN 5: SOSYAL KANIT / ALBÜM
**Başlık:** "Viral olan estetik"  
**Alt başlık:** "Instagram ve TikTok'ta milyonlarca beğeni alan Y2K görünümü. Tek dokunuşla sen de yap."  

**Photo Grid:** 6 fotoğraf (3x2)
- Her biri: aspect-ratio 1, border-radius 8px
- Border: 2px solid rgba(245,240,232,0.1)
- Döndürülmüş: -3deg, 2deg, -1deg, 4deg, -2deg, 1deg (scatter effect)
- Hover: rotate(0deg), scale(1.05), border-color #e8a87c, z-index 10
- Filtreler: Her biri farklı Y2K preset
- Animasyon: Staggered drop (her biri 150ms delay, spring animation)

**Review Badge:**
- ⭐ "En iyi Y2K uygulaması" — App Store Kullanıcı Yorumu
- Background: rgba(232,168,124,0.1)
- Border-radius: 12px
- Padding: 12px 16px

**Buton:** "Başlayalım →"

---

### EKRAN 6: VIBE SEÇİMİ
**Başlık:** "Senin viben hangisi?"  
**Alt başlık:** "Sana özel filtreler önermemiz için birini seç. İstediğin zaman değiştirebilirsin."  

**Vibe Cards:** 3 adet (vertical stack)

1. **Y2K Glow** (default selected)
   - Icon: ✨, Background: linear-gradient(135deg, #e8a87c, #d4a574)
   - Description: "Parlak, canlı CCD tonları"
   - Check: right side, circle, selected: background #e8a87c, icon ✓

2. **90s Tane**
   - Icon: 🎞️, Background: linear-gradient(135deg, #8b7355, #a0826d)
   - Description: "Sıcak, doğal film tane"

3. **Disposable**
   - Icon: 📸, Background: linear-gradient(135deg, #6b8e9f, #8faabb)
   - Description: "Bulanık, pastel tek kullanımlık"

**Card Tasarımı:**
- Flex direction: row, align-items center, gap 16px
- Padding: 16px 20px
- Background: rgba(245,240,232,0.05)
- Border: 2px solid rgba(245,240,232,0.1)
- Border-radius: 16px
- Selected: border-color #e8a87c, background rgba(232,168,124,0.1)
- Icon container: 48px, border-radius 12px
- Title: 15px, font-weight 600
- Description: 12px, color rgba(245,240,232,0.5)

**Buton:** "Kamerayı Aç →"
- On press: Save selected vibe to AsyncStorage, navigate to ATT screen

---

### EKRAN 7: ATT (App Tracking Transparency) SOFT-ASK
**BAŞLIK:** "Filtrelerini kişiselleştir"  
**Alt başlık:** "Sana en uygun Y2K filtrelerini önerebilmemiz için izin ver. Verilerin asla paylaşılmaz."  

**Icon:** 🔒, 80px, background linear-gradient(135deg, #e8a87c, #d4a574), border-radius 24px

**Benefits:** 3 adet (vertical stack)

1. 🎯 "Kişiselleştirilmiş öneriler"
   - Sub: "Beğendiğin tarzlara göre filtre önerisi"

2. 📊 "Daha iyi deneyim"
   - Sub: "Uygulama performansını iyileştirmek için"

3. 🔒 "Güvenli ve gizli"
   - Sub: "Verilerin üçüncü taraflarla paylaşılmaz"

**Benefit Card:**
- Flex direction: row, align-items center, gap 12px
- Padding: 12px 16px
- Background: rgba(245,240,232,0.05)
- Border-radius: 12px
- Text-align: left
- Icon: 32px container, background rgba(232,168,124,0.2), border-radius 8px
- Title: 13px, font-weight 600
- Sub: 11px, color rgba(245,240,232,0.5)

**Primary Button:** "İzin Ver ve Başla"
- On press: requestTrackingPermissionsAsync(), then navigate to Home

**Secondary Button:** "Sonra Sor"
- On press: Navigate to Home (no ATT)
- Background: transparent, border 1px solid rgba(245,240,232,0.15)
- Text: rgba(245,240,232,0.6), 14px

**KURAL:** ATT native dialog'u SADECE "İzin Ver ve Başla" butonuna basıldığında göster. Ekran 7 kendi custom UI'ımız. Native dialog hemen ardından.

---

### HOME SCREEN (Onboarding Sonrası)
**Açılış:** HEMEN kamera erişimi. Zorunlu kayıt YOK.

**Hint Banner:**
- Position: bottom (kamera butonunun üstü)
- Background: rgba(245,240,232,0.05)
- Border: 1px dashed rgba(245,240,232,0.15)
- Border-radius: 16px
- Padding: 20px
- Text: "💡 İpucu: 3. fotoğrafından sonra tüm filtreleri açabilirsin."
- Text color: #f5f0e8, 14px

**Kamera Butonu:**
- Center bottom, 80px circle
- Background: #e8a87c
- Icon: 📷, 36px
- Shadow: 0 8px 32px rgba(232,168,124,0.4)

---

## PAYWALL STRATEJİSİ (RevenueCat)

### FREEMIUM MODEL

**Ücretsiz:**
- 3 temel Y2K filtresi (Classic M, D Classic, CCD R)
- Her 3-5 fotoğrafta 1 interstitial reklam
- Küçük "RetroCam" watermark (sağ alt köşe, 30% opacity)
- 480p kaydetme
- Sadece fotoğraf (video yok)

**Pro (RetroCam Pro):**

eski paywall bakabilirsin ..C:\Users\User\Desktop\retrocam\app\paywall.tsx
- 20+ Y2K & Vintage filtre (tüm kamera modelleri)
- Reklamsız deneyim
- 4K/1080p kaydetme
- Özel light leak & grain efektleri
- Custom date stamp (tarih damgası)
- Video filter desteği (8mm, VHS)
- Tüm kamera modelleri (D Exp, özel presetler)
- Watermark kaldırma
- Instagram/TikTok doğrudan paylaşım

### FİYATLANDIRMA (RevenueCat Dashboard)

| Paket | Fiyat | Trial | Öncelik |
|-------|-------|-------|---------|
| **Haftalık** apple store connetion dan çekilecek 
| **Aylık**    apple store connetion dan çekilecek
| **Yıllık**  apple store connetion dan çekilecek

### PAYWALL ZAMANLAMASI

1. **1. Paywall:** 3. fotoğraf editinden SONRA (değer sonrası)
   - Context: Kullanıcı 3. fotoğrafı çekip filtreyi uyguladıktan sonra
   - Trigger: photoCount === 3 && !isPro && !hasSeenPaywall
   - Action: presentPaywallIfNeeded()

2. **2. Paywall:** 7. fotoğrafta (tekrar deneme)
   - Context: Kullanıcı devam ediyor, hala Pro değil
   - Trigger: photoCount === 7 && !isPro
   - Action: presentPaywall()

3. **3. Paywall:** Contextual (özellik bazlı)
   - 4K kaydetmek istediğinde
   - Video moduna geçmek istediğinde
   - Watermark kaldırmak istediğinde
   - Action: presentPaywallIfNeeded()

4. **Exit Offer:** Paywall'ı kapatan kullanıcıya
   - "%50 İndirim — Sınırlı Süre" teklifi
   - Sadece 1 kez göster

### REVENUECAT KONFİGÜRASYONU

app\paywall.tsx eski paywall dosyasının aynısı..
---

## TASARIM SİSTEMİ

### RENK PALETİ
```typescript
const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  primary: '#e8a87c',
  primaryLight: '#f0c4a0',
  primaryDark: '#c98a5e',
  secondary: '#6b8e9f',
  secondaryLight: '#8faabb',
  textPrimary: '#f5f0e8',
  textSecondary: 'rgba(245,240,232,0.6)',
  textMuted: 'rgba(245,240,232,0.4)',
  success: '#7cb87c',
  error: '#e87c7c',
  warning: '#e8c87c',
};
```

### TİPOGRAFİ
```typescript
const typography = {
  headline: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.02,
    color: colors.textPrimary,
  },
  subheadline: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: '#0a0a0a',
  },
};
```

### ANİMASYON DEĞERLERİ
```typescript
const animations = {
  durations: {
    grainFadeIn: 800,
    lightLeakWipe: 600,
    shutterClick: 150,
    vhsGlitch: 400,
    photoDrop: 600,
    photoDropStagger: 150,
    fadeInUp: 600,
    screenTransition: 400,
  },
  easings: {
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: { damping: 15, stiffness: 150 },
  },
};
```

---



---

## KOD ÖRNEKLERİ (Kritik Dosyalar)

### 1. Onboarding Store (Zustand)

```typescript
// src/stores/onboardingStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isCompleted: boolean;
  currentScreen: number;
  selectedVibe: string | null;
  photoCount: number;
  hasSeenPaywall: boolean;
  hasSeenExitOffer: boolean;
  attStatus: 'undetermined' | 'granted' | 'denied';

  setCompleted: (completed: boolean) => void;
  setCurrentScreen: (screen: number) => void;
  setSelectedVibe: (vibe: string) => void;
  incrementPhotoCount: () => void;
  setHasSeenPaywall: (seen: boolean) => void;
  setHasSeenExitOffer: (seen: boolean) => void;
  setATTStatus: (status: 'undetermined' | 'granted' | 'denied') => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isCompleted: false,
      currentScreen: 0,
      selectedVibe: null,
      photoCount: 0,
      hasSeenPaywall: false,
      hasSeenExitOffer: false,
      attStatus: 'undetermined',

      setCompleted: (completed) => set({ isCompleted: completed }),
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      setSelectedVibe: (vibe) => set({ selectedVibe: vibe }),

      incrementPhotoCount: () => {
        const newCount = get().photoCount + 1;
        set({ photoCount: newCount });

        // Paywall trigger: 3. fotoğrafta
        if (newCount === 3 && !get().hasSeenPaywall) {
          set({ hasSeenPaywall: true });
        }

        // 2. paywall: 7. fotoğrafta
        if (newCount === 7) {
          // Event: paywall_should_show_again
        }
      },

      setHasSeenPaywall: (seen) => set({ hasSeenPaywall: seen }),
      setHasSeenExitOffer: (seen) => set({ hasSeenExitOffer: seen }),
      setATTStatus: (status) => set({ attStatus: status }),

      reset: () => set({
        isCompleted: false,
        currentScreen: 0,
        selectedVibe: null,
        photoCount: 0,
        hasSeenPaywall: false,
        hasSeenExitOffer: false,
        attStatus: 'undetermined',
      }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 2. RevenueCat Hook

```typescript
// src/hooks/useRevenueCat.ts
import { useState, useEffect } from 'react';
import Purchases, { 
  CustomerInfo, 
  LOG_LEVEL,
  PurchasesOffering 
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || '',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '',
};

export const ENTITLEMENT_ID = 'premium';

export function useRevenueCat() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
      if (!apiKey) throw new Error('RevenueCat API key not configured');
      await Purchases.configure({ apiKey });

      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
        const hasPro = !!info.entitlements.active[ENTITLEMENT_ID];
        setIsPro(hasPro);
      });

      await loadOfferings();
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('RevenueCat init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) setOfferings(offerings.current);
    } catch (error) {
      console.error('Load offerings error:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const hasPro = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsPro(hasPro);
      return hasPro;
    } catch (error) {
      console.error('Check subscription error:', error);
      return false;
    }
  };

  const presentPaywall = async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywall();
      return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    } catch (error) {
      console.error('Present paywall error:', error);
      return false;
    }
  };

  const presentPaywallIfNeeded = async (): Promise<boolean> => {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
      return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    } catch (error) {
      console.error('Present paywall if needed error:', error);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      const hasPro = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsPro(hasPro);
      return hasPro;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  };

  return {
    isPro, isLoading, offerings, customerInfo,
    presentPaywall, presentPaywallIfNeeded, restorePurchases, checkSubscriptionStatus,
  };
}
```

### 3. ATT Permission Hook

```typescript
// src/hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export function usePermissions() {
  const [attStatus, setAttStatus] = useState<string>('undetermined');
  const [cameraPermission, setCameraPermission] = useState(false);
  const [mediaPermission, setMediaPermission] = useState(false);

  useEffect(() => {
    checkCameraPermission();
    checkMediaPermission();
  }, []);

  const requestATT = async (): Promise<boolean> => {
    try {
      const { status } = await requestTrackingPermissionsAsync();
      setAttStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('ATT request error:', error);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setCameraPermission(granted);
    return granted;
  };

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setMediaPermission(granted);
    return granted;
  };

  const checkCameraPermission = async () => {
    const { status } = await Camera.getCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const checkMediaPermission = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    setMediaPermission(status === 'granted');
  };

  return {
    attStatus, cameraPermission, mediaPermission,
    requestATT, requestCameraPermission, requestMediaPermission,
  };
}
```

### 4. Paywall Trigger Hook

```typescript
// src/hooks/usePaywall.ts
import { useCallback } from 'react';
import { useRevenueCat } from './useRevenueCat';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function usePaywall() {
  const { isPro, presentPaywall, presentPaywallIfNeeded } = useRevenueCat();
  const { photoCount, hasSeenPaywall, hasSeenExitOffer, setHasSeenPaywall, setHasSeenExitOffer } = useOnboardingStore();

  const checkAndShowPaywall = useCallback(async (): Promise<boolean> => {
    if (isPro) return false;

    if (photoCount === 3 && !hasSeenPaywall) {
      setHasSeenPaywall(true);
      return await presentPaywallIfNeeded();
    }

    if (photoCount === 7) {
      return await presentPaywall();
    }

    return false;
  }, [isPro, photoCount, hasSeenPaywall, presentPaywallIfNeeded, presentPaywall, setHasSeenPaywall]);

  const showContextualPaywall = useCallback(async (feature: string): Promise<boolean> => {
    if (isPro) return false;
    const contextualFeatures = ['4k', 'video', 'watermark', 'export_hd'];
    if (contextualFeatures.includes(feature)) {
      return await presentPaywallIfNeeded();
    }
    return false;
  }, [isPro, presentPaywallIfNeeded]);

  const showExitOffer = useCallback(async (): Promise<boolean> => {
    if (isPro || hasSeenExitOffer) return false;
    setHasSeenExitOffer(true);
    return await presentPaywall();
  }, [isPro, hasSeenExitOffer, presentPaywall, setHasSeenExitOffer]);

  return { checkAndShowPaywall, showContextualPaywall, showExitOffer };
}
```

### 5. Root Layout (Entry Point)

```typescript
// src/app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { initializeRevenueCat } from '@/services/revenuecat';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { registerForPushNotifications } from '@/services/notifications';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const isCompleted = useOnboardingStore((s) => s.isCompleted);

  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Bold': require('@/assets/fonts/SpaceGrotesk-Bold.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initializeRevenueCat();
        await registerForPushNotifications();
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (isReady && fontsLoaded) {
      SplashScreen.hideAsync();
      if (!isCompleted) {
        router.replace('/onboarding/splash');
      } else {
        router.replace('/(tabs)/camera');
      }
    }
  }, [isReady, fontsLoaded, isCompleted]);

  if (!isReady || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
```

---

## PUSH NOTIFICATION STRATEJİSİ

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function scheduleRetentionNotifications() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📸 İlk Y2K fotoğrafın nasıl oldu?',
      body: 'Yeni filtreler seni bekliyor!',
      data: { screen: 'camera', type: 'day1_retention' },
    },
    trigger: { seconds: 24 * 60 * 60 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✨ Yeni "Cyber Y2K" filtresi eklendi!',
      body: 'Sınırlı süreyle ücretsiz dene.',
      data: { screen: 'camera', filter: 'cyber_y2k', type: 'new_filter' },
    },
    trigger: { seconds: 2 * 24 * 60 * 60 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Pro denemen bitmek üzere!',
      body: 'Tüm Y2K filtrelerini ve 4K kaydetmeyi kaçırma.',
      data: { screen: 'paywall', type: 'trial_reminder' },
    },
    trigger: { seconds: 3 * 24 * 60 * 60 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Bu hafta en çok kullanılan: CCD R',
      body: 'Sen de dene ve Instagramda viral ol!',
      data: { screen: 'camera', filter: 'ccd_r', type: 'trending_filter' },
    },
    trigger: { seconds: 7 * 24 * 60 * 60 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎨 Instagram Storyn için özel Y2K şablonu',
      body: 'Tek dokunuşla paylaş, beğenileri kas!',
      data: { screen: 'gallery', type: 'story_template' },
    },
    trigger: { seconds: 14 * 24 * 60 * 60 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Yıllık abonelik %50 indirimde!',
      body: 'Sınırlı süre — kaçırma!',
      data: { screen: 'paywall', discount: '50_off', type: 'discount' },
    },
    trigger: { seconds: 30 * 24 * 60 * 60 },
  });
}
```

---

## A/B TEST PLAN

### Test 1: Onboarding Length
| Varyant | Ekran Sayısı | Hypothesis | Metrik |
|---------|-------------|------------|--------|
| A | 7 ekran (mevcut) | Daha fazla değer = daha iyi retention | Completion rate, Day 1 retention |
| B | 4 ekran (kısa) | Daha kısa = daha az çıkış | Completion rate, Day 1 retention |

### Test 2: Paywall Timing
| Varyant | Trigger | Hypothesis | Metrik |
|---------|---------|------------|--------|
| A | 3. fotoğrafta | Değer sonrası = daha iyi conversion | Paywall conversion, MRR |
| B | 5. fotoğrafta | Daha fazla değer = daha iyi conversion | Paywall conversion, MRR |
| C | 1. fotoğrafta (agresif) | Erken = daha fazla gösterim | Paywall conversion (düşük beklenti) |

### Test 3: Fiyatlandırma Önceliği
fiyatlandırma eski onboarding bakabilirsin. otomatik app store dan fiyat çekilecek..C:\Users\User\Desktop\retrocam\app\paywall.tsx

### Test 4: ATT Soft-Ask
| Varyant | Soft-Ask | Hypothesis | Metrik |
|---------|----------|------------|--------|
| A | 3 benefit kartı (mevcut) | Daha fazla bilgi = daha iyi opt-in | ATT opt-in rate |
| B | Sadece 1 benefit | Daha kısa = daha az sürtünme | ATT opt-in rate |
| C | Native ATT direkt (soft-ask yok) | Apple native = daha güvenilir | ATT opt-in rate |

---

## METRİKLER VE ANALİTİK

### İzlenecek Metrikler (Dashboard)

| Metrik | Hedef | Araç | Frekans |
|--------|-------|------|---------|
| Onboarding Completion Rate | %70+ | Custom events | Günlük |
| Skip Rate | <%30 | Custom events | Günlük |
| ATT Opt-in Rate | %40+ | expo-tracking-transparency | Günlük |
| Time to First Photo | <10 sn | Custom timer | Günlük |
| Paywall Conversion Rate | %5+ | RevenueCat | Günlük |
| Trial Start Rate | %10+ | RevenueCat | Günlük |
| Trial-to-Paid Conversion | %25+ | RevenueCat | Haftalık |
| Day 1 Retention | %15+ | Custom events | Günlük |
| Day 7 Retention | %8+ | Custom events | Haftalık |
| Day 30 Retention | %5+ | Custom events | Aylık |
| Churn Rate | <%20 | RevenueCat | Aylık |
| MRR | $30+ | RevenueCat | Günlük |
| ARPU | $0.50+ | RevenueCat | Aylık |
| LTV | $5+ | RevenueCat | Aylık |

### Custom Events (Analytics)

```typescript
// src/services/analytics.ts
export const AnalyticsEvents = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_SCREEN_VIEW: 'onboarding_screen_view',
  ONBOARDING_NEXT: 'onboarding_next',
  ONBOARDING_SKIP: 'onboarding_skip',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  VIBE_SELECTED: 'vibe_selected',
  ATT_SOFT_ASK_SHOWN: 'att_soft_ask_shown',
  ATT_SOFT_ASK_ACCEPTED: 'att_soft_ask_accepted',
  ATT_SOFT_ASK_DENIED: 'att_soft_ask_denied',
  ATT_NATIVE_GRANTED: 'att_native_granted',
  ATT_NATIVE_DENIED: 'att_native_denied',
  CAMERA_OPENED: 'camera_opened',
  PHOTO_TAKEN: 'photo_taken',
  FILTER_APPLIED: 'filter_applied',
  VIDEO_RECORDED: 'video_recorded',
  PAYWALL_SHOWN: 'paywall_shown',
  PAYWALL_CLOSED: 'paywall_closed',
  PAYWALL_PURCHASE_STARTED: 'paywall_purchase_started',
  PAYWALL_PURCHASE_COMPLETED: 'paywall_purchase_completed',
  PAYWALL_PURCHASE_FAILED: 'paywall_purchase_failed',
  EXIT_OFFER_SHOWN: 'exit_offer_shown',
  EXIT_OFFER_ACCEPTED: 'exit_offer_accepted',
  PHOTO_SAVED: 'photo_saved',
  PHOTO_SHARED_INSTAGRAM: 'photo_shared_instagram',
  PHOTO_SHARED_TIKTOK: 'photo_shared_tiktok',
  TRIAL_STARTED: 'trial_started',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
} as const;

export function logEvent(event: string, params?: Record<string, any>) {
  console.log(`[Analytics] ${event}`, params);
}
```

---

## KURULUM ADIMLARI (Başlangıçtan Bitişe)

### Adım 1: Proje Oluşturma
```bash
npx create-expo-app retrocam --template blank-typescript
npx expo install expo-router react-native-reanimated
npm install zustand
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-purchases react-native-purchases-ui
npx expo install expo-tracking-transparency expo-camera expo-media-library expo-notifications expo-font expo-dev-client
```

### Adım 2: Font ve Asset Kurulumu
```bash
# SpaceGrotesk ve Inter fontlarını indir
# assets/fonts/ dizinine koy
# Onboarding görsellerini hazırla
# assets/images/ dizinine koy
```

### Adım 3: RevenueCat Dashboard Kurulumu
```
1. https://app.revenuecat.com/ → Sign up
2. New Project → "RetroCam"
3. App Store Connect API Key ekle
4. Google Play Service Account ekle
5. Products oluştur: rc_weekly_099, rc_monthly_299, rc_yearly_1499, rc_lifetime_1999
6. Entitlement: "pro" oluştur
7. Offering: "default" oluştur
8. Paywall template seç (Y2K teması)
```

### Adım 4: Environment Variables
```bash
# .env dosyası
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_YOUR_APPLE_API_KEY
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_YOUR_GOOGLE_API_KEY
```

### Adım 5: Build ve Test
```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

### Adım 6: App Store Gönderim
```bash
# iOS
# 1. App Store Connect → Subscription Group
# 2. Products oluştur (weekly, monthly, yearly, lifetime)
# 3. EAS build production
# 4. TestFlight'da test et
# 5. App Review'a gönder
```

---

## ÖNEMLİ NOTLAR VE UYARILAR

### 1. App Store Review Guidelines
- **Paywall:** Değer gösterildikten SONRA göster (3. fotoğraftan sonra)
- **Trial:** 7 günlük trial açıkça belirt
- **Subscription:** Cancel anytime vurgula
- **ATT:** Info.plist'e NSUserTrackingUsageDescription ekle
- **Privacy:** Privacy Nutrition Label doldur
- **Screenshots:** 5 screenshot + App Preview video

### 2. RevenueCat Best Practices
- **Sandbox testing:** TestFlight'da test etmeden önce sandbox'ta test et
- **Receipt validation:** RevenueCat otomatik yapar
- **Webhook:** Churn, renewal, expiration event'lerini dinle
- **Customer support:** Refund ve subscription management desteği

### 3. Performance
- **Onboarding time:** <20 sn (skip ile), <45 sn (full flow)
- **Animation:** 60fps, Reanimated kullan
- **Image optimization:** WebP formatı, lazy loading
- **Bundle size:** <50MB (App Store limit)

### 4. Legal
- **Terms of Service:** Abonelik şartları, iptal politikası
- **Privacy Policy:** Veri toplama, ATT açıklaması
- **EULA:** Eğer App Store'da zorunlu ise
- **Trademark:** "RetroCam" marka tescili kontrol et

---

## SONUÇ

Bu prompt, RetroCam uygulamasının onboarding, paywall, RevenueCat entegrasyonu ve retention stratejisini detaylıca açıklıyor. Tüm teknik detaylar, kod örnekleri, dosya yapısı ve kurulum adımları dahil.

**Hedefler:**
- Day 1 Retention: 3% → 10%+
- MRR: $6 → $30+
- Conversion Rate: 2.6% → 5%+
- ATT Opt-in: 30% → 50%+
- Paywall Conversion: 0.5% → 3%+

**Tahmini süre:**
- Onboarding: 2-3 gün
- RevenueCat entegrasyonu: 1-2 gün
- Paywall: 1 gün
- Push notifications: 1 gün
- Test: 2-3 gün
- App Store gönderim: 1-2 gün
- **Toplam: 8-12 gün**

**Gerekli ekib:**
- 1 React Native developer (sen)
- 1 UI/UX designer (onboarding görselleri)
- 1 RevenueCat dashboard yöneticisi (sen)

Başarılar!
