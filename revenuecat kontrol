---
name: rn-revenuecat-review
description: React Native + RevenueCat entegrasyonu olan projelerde kod kalite kontrolü yapar. Kullanıcı "kontrol et", "hataları bul", "RevenueCat doğru mu", "subscription çalışıyor mu", "premium geçiş", "store dosyaları incele" dediğinde bu skill'i kullan. Zustand store, paywall modal, layout init, premium state yönetimi, entitlement kontrolü gibi konularda otomatik denetim raporu üretir.
---

# React Native RevenueCat Kod İnceleme Skill'i

Bu skill, React Native projelerinde RevenueCat entegrasyonu ve premium abonelik akışını denetler. Aşağıdaki kontrol listesini sırayla uygula.

---

## ADIM 1 — Dosyaları Oku

Önce mevcut proje dosyalarını listele ve şu dosyaları bul:

- `RevenueCatService.ts` (veya `.js`)
- `useAppStore.ts` — Zustand store
- `_layout.tsx` — Root layout (RevenueCat configure içeren)
- `paywall.tsx` — Paywall modal/screen
- `profile.tsx` — Profil ekranı

Her birini `view` tool ile oku. Dosya bulunamazsa kullanıcıya hangi dosyanın eksik olduğunu söyle.

---

## ADIM 2 — Kontrol Listesi

Her maddeyi tek tek kontrol et ve sonucu ✅ / ❌ olarak işaretle.

### 🔴 KRİTİK — RevenueCatService.ts

- [ ] **RC-1** `isConfigured = true` satırı `await Purchases.configure(...)` öncesinde mi?
- [ ] **RC-2** `setPremium(isPremium, plan)` her çağrıda plan parametresiyle mi çağrılıyor? (`setPremium(isPremium)` şeklinde plan eksik çağrı var mı?)
- [ ] **RC-3** `addCustomerInfoUpdateListener` sonucu bir değişkene atanıp cleanup yapılıyor mu? (`listenerRemover` gibi)
- [ ] **RC-4** `ENTITLEMENT_ID` sabiti tanımlı mı ve RevenueCat dashboard'undaki entitlement adıyla birebir eşleşiyor mu?
- [ ] **RC-5** `getPlanFromSubscriptions` fonksiyonu `annual`, `yearly`, `monthly`, `weekly` string'lerini kontrol ediyor mu?

### 🔴 KRİTİK — useAppStore.ts

- [ ] **ST-1** `isPremium` ve `subscriptionPlan` alanları `partialize` ile AsyncStorage persist'ten **dışlanmış** mı?
  ```typescript
  // DOĞRU olması gereken
  partialize: (state) => {
    const { isPremium, subscriptionPlan, ...rest } = state;
    return rest;
  }
  ```
- [ ] **ST-2** `syncWithRevenueCat` fonksiyonu store içinde tanımlı mı?
- [ ] **ST-3** `syncWithRevenueCat` içinde `Purchases` static import ile mi kullanılıyor? (dynamic `import(...)` kullanılıyor mu? — kullanılıyorsa hata)
- [ ] **ST-4** `setPremium(value, plan = null)` imzasında default değer var mı?
- [ ] **ST-5** `setHasHydrated` action'ı ve `onRehydrateStorage` callback'i mevcut mu?

### 🔴 KRİTİK — _layout.tsx (Root Layout)

- [ ] **LY-1** `RevenueCatService.configure()` bir `async init()` fonksiyonu içinde `await` ile çağrılıyor mu?
  ```typescript
  // DOĞRU
  const init = async () => {
    await Promise.all([RevenueCatService.configure(), initI18n()]);
    setIsI18nInitialized(true);
  };
  void init();
  ```
- [ ] **LY-2** Router yönlendirmesi `isI18nInitialized` ve `_hasHydrated` kontrol edildikten sonra mı çalışıyor?
- [ ] **LY-3** Splash screen `isMounted && _hasHydrated && isI18nInitialized` üçü birden true olunca mı gizleniyor?

### 🟡 ORTA — paywall.tsx

- [ ] **PW-1** `PaywallModal` bir Modal component mi, yoksa standalone route olarak mı açılıyor? (route olarak `router.replace('/paywall')` ile açılıyorsa ve component `visible` prop bekliyorsa — hata)
- [ ] **PW-2** DEV modunda `setPremium(true, ...)` çağrısı plan parametresiyle birlikte mi yapılıyor?
  ```typescript
  // YANLIŞ
  setPremium(true)
  // DOĞRU
  setPremium(true, 'yearly')
  ```
- [ ] **PW-3** `offerings.annual` ile `offerings.weekly`, `offerings.monthly` kontrolleri var mı?
- [ ] **PW-4** Satın alma başarısız olduğunda `e.userCancelled` kontrolü yapılıyor mu? (iptal edilince hata alert'i gösterilmemeli)

### 🟡 ORTA — profile.tsx

- [ ] **PR-1** `subscriptionPlan` gösteriminde `null` fallback var mı?
  ```typescript
  // YANLIŞ — null 'weekly' olarak gösterilir
  subscriptionPlan === 'yearly' ? ... : subscriptionPlan === 'monthly' ? ... : t('paywall.weekly')
  
  // DOĞRU
  subscriptionPlan === 'yearly' ? t('paywall.yearly')
    : subscriptionPlan === 'monthly' ? t('paywall.monthly')
    : subscriptionPlan === 'weekly' ? t('paywall.weekly')
    : t('paywall.yearly') // null fallback
  ```
- [ ] **PR-2** DEV butonları (`Switch to Free`, `Switch to Premium`) `{__DEV__ && (...)}` bloğu içinde mi?
- [ ] **PR-3** Restore purchases hem `profile.tsx` hem `paywall.tsx` içinde erişilebilir mi?

---

## ADIM 3 — Rapor Üret

Tüm kontrolleri tamamladıktan sonra şu formatta rapor yaz:

```
## 📋 Kod İnceleme Raporu

### ✅ Geçen Kontroller (X/Y)
[Geçen maddeleri listele]

### ❌ Başarısız Kontroller
| Kod | Dosya | Sorun | Öncelik |
|-----|-------|-------|---------|
| RC-2 | RevenueCatService.ts | setPremium plan parametresiz çağrılıyor | 🔴 Kritik |
...

### 🔧 Önerilen Düzeltmeler
[Her ❌ için kısa kod örneği ile düzeltme öner]
```

---

## ADIM 4 — Düzeltme İsteği

Raporu sunduktan sonra kullanıcıya sor:
> "Hangi dosyaların tam düzeltilmiş kodunu yazmamı istersin?"

Kullanıcı onaylarsa ilgili dosyanın **tamamını** yaz — sadece değişen satırları değil.

---

## Sık Karşılaşılan Hatalar Referansı

| Hata | Neden Önemli |
|------|-------------|
| `isPremium` persist edilmesi | Abonelik iptalinde kullanıcı çevrimdışıyken premium görünür, Apple review'da sorun çıkar |
| `setPremium` plan parametresiz | Profile ekranında yanlış plan adı gösterilir |
| RC configure `void` ile fire-and-forget | Premium kullanıcı açılışta anlık free ekranı görür (flash) |
| `null` plan fallback eksik | `subscriptionPlan === null` iken "Weekly" yazısı çıkar |
| Listener cleanup eksik | Memory leak, eski listener'lar birikir |
| Dynamic import store içinde | Native modüllerde çalışmayabilir, sessiz hata verir |