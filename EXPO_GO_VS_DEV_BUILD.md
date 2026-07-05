# Expo Go vs Development Build - RetroCam

## 🚨 Problem

Android 13+ (API 33+) değişiklikleri nedeniyle **Expo Go artık MediaLibrary granular permissions'ı desteklemiyor**.

### Expo Go'da Çalışan:
✅ Camera permission
✅ Microphone permission
⚠️ MediaLibrary (Sınırlı - sadece temel erişim)

### Expo Go'da Çalışmayan:
❌ MediaLibrary granular permissions (photo, video, audio ayrı ayrı)
❌ READ_MEDIA_IMAGES, READ_MEDIA_VIDEO gibi Android 13+ permissions

## ✅ Çözüm: Development Build

### 1. Development Build Nedir?
Expo Go yerine, **uygulamanızın özel bir sürümü** - tüm native kodları içerir ve production build gibi çalışır.

### 2. Development Build Nasıl Oluşturulur?

#### Adım 1: EAS CLI Kurulumu (Bir kez)
```bash
npm install -g eas-cli
eas login
```

#### Adım 2: Development Build Oluştur

**Android için:**
```bash
eas build --profile development --platform android
```

**iOS için:**
```bash
eas build --profile development --platform ios
```

#### Adım 3: Build'i İndir ve Yükle
- Build tamamlandığında size bir link verilir
- APK/IPA dosyasını indirin
- Cihazınıza yükleyin

#### Adım 4: Development Server'ı Başlat
```bash
npx expo start --dev-client
```

### 3. Hızlı Test için Preview Build

Development build çok uzun sürerse, **preview build** kullanabilirsiniz:

**Android:**
```bash
eas build --profile preview --platform android
```

**iOS:**
```bash
eas build --profile preview --platform ios
```

### 4. EAS Build Profiles (eas.json)

Mevcut profiles:
- `development`: Development build (hot reload + fast refresh)
- `preview`: Test build (production benzeri ama profiling açık)
- `production`: Production build (app store'a yüklenecek)

## 🔧 Geçici Çözüm (Şu Anki Durum)

Kod şimdi şu şekilde çalışıyor:

1. **Expo Go'da**: MediaLibrary permission hatası yakalar ve devam eder (sınırlı fonksiyon)
2. **Development/Production Build'de**: Tüm permissions tam çalışır

```typescript
try {
  libResult = await requestLibraryPermission();
} catch (error: any) {
  if (error?.message?.includes('Expo Go')) {
    // Expo Go - skip MediaLibrary permission
    libResult = { granted: true };
  }
}
```

## 📱 Hangi Seçenek Size Uygun?

### Expo Go Kullan (Şu An):
✅ Hızlı test
✅ Camera ve microphone çalışır
⚠️ Gallery kaydetme sınırlı olabilir

### Development Build Kullan (Önerilen):
✅ Tüm fonksiyonlar çalışır
✅ Production gibi test
❌ Build süresi uzun (ilk kez 10-15 dakika)
❌ Her native değişiklikte yeniden build gerekir

### Preview/Production Build:
✅ Final test
✅ App store'a hazır
❌ Build süresi en uzun

## 🎯 Önerilen Workflow

1. **Geliştirme aşaması**: Expo Go (hızlı test için)
2. **Feature tamamlandı**: Development Build (tam test)
3. **Release öncesi**: Preview Build (son kontrol)
4. **Release**: Production Build (app store)

## 📚 Daha Fazla Bilgi

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Android 13 Media Permissions](https://developer.android.com/about/versions/13/behavior-changes-13#granular-media-permissions)
