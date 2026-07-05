# Permission Hatası Çözümü - Adım Adım

## ✅ Yapılan Değişiklikler

1. **PermissionScreen.tsx**: MediaLibrary permission'ı artık sadece 'photo' ve 'video' için istiyor
2. **app.json**: ACCESS_MEDIA_LOCATION permission eklendi

## 🚀 ŞİMDİ YAPMANIZ GEREKENLER (ÖNEMLİ!)

### Adım 1: Expo Dev Server'ı Durdurun
Terminal'de `Ctrl+C` ile durdurun.

### Adım 2: Cache'i Temizleyip Yeniden Başlatın
```bash
npx expo start -c
```

### Adım 3: Uygulamayı Tekrar Açın
- Expo Go'da QR kodu yeniden okutun
- Veya terminal'de `a` (Android) / `i` (iOS) tuşuna basın

## 🔧 Eğer Hala Çalışmazsa

### Android için Native Rebuild:
```bash
# 1. Android klasörünü silin (varsa)
rmdir /s /q android

# 2. Prebuild yapın
npx expo prebuild --platform android

# 3. Yeniden başlatın
npx expo start -c
```

### iOS için Native Rebuild:
```bash
# 1. iOS klasörünü silin (varsa)
rmdir /s /q ios

# 2. Prebuild yapın
npx expo prebuild --platform ios

# 3. Yeniden başlatın
npx expo start -c
```

## 📱 Build için (EAS)

Android build:
```bash
eas build --platform android --profile preview
```

iOS build:
```bash
eas build --platform ios --profile preview
```

## 🎯 Ne Değişti?

**ÖNCE:**
```typescript
const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();
const libResult = await requestLibraryPermission();
```
❌ Bu tüm permissions'ı (audio dahil) istiyordu

**SONRA:**
```typescript
const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions({
  granularPermissions: ['photo', 'video']
});
const libResult = await requestLibraryPermission(['photo', 'video']);
```
✅ Sadece photo ve video permissions isteniyor

## ⚠️ ÖNEMLİ NOT

Expo Go'da değişikliklerin etkili olması için mutlaka:
1. Server'ı **tamamen durdurun**
2. Cache ile **yeniden başlatın**: `npx expo start -c`
3. Uygulamayı **yeniden açın**

Aksi halde eski native kod çalışmaya devam eder!
