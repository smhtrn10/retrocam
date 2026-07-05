# RetroCam Permission Hatası Çözüm Adımları

## Yapılan Değişiklikler

### 1. app.json - expo-media-library yapılandırması güncellendi:
- ✅ `audio` permission **kaldırıldı** (sadece photo ve video gerekli)
- ✅ `isAccessMediaLocationEnabled: true` eklendi

### 2. app.json - Android permissions güncellendi:
- ✅ `android.permission.READ_MEDIA_AUDIO` **kaldırıldı**
- ✅ Gereksiz audio permission artık istenmeyecek

### 3. PermissionScreen.tsx temizlendi:
- ✅ Kullanılmayan import'lar kaldırıldı

## Uygulamayı Çalıştırmak İçin

### Expo Go ile Test (Development):
```bash
# Cache temizle
npx expo start -c

# Veya
npm start -- --clear
```

### Android Build için:
```bash
# Native klasörleri temizle ve yeniden oluştur
npx expo prebuild --clean

# EAS build
eas build --platform android --profile preview
```

### iOS Build için:
```bash
# Native klasörleri temizle ve yeniden oluştur
npx expo prebuild --clean

# EAS build
eas build --platform ios --profile preview
```

## Hata Çözümü

Eğer hala hata alırsanız:

1. **Android klasörünü sil** (varsa):
   ```bash
   rmdir /s /q android
   ```

2. **iOS klasörünü sil** (varsa):
   ```bash
   rmdir /s /q ios
   ```

3. **Node modules ve cache temizle**:
   ```bash
   rmdir /s /q node_modules
   del /q package-lock.json
   npm install
   ```

4. **Expo cache temizle**:
   ```bash
   npx expo start -c
   ```

## Açıklama

Hata nedeni: `expo-media-library` config'inde `audio` permission vardı ama bu sadece video/fotoğraf için kullanılıyor. Audio permission, `expo-camera` tarafından video çekimi için zaten yönetiliyor (RECORD_AUDIO).

Çözüm: Media Library'den audio permission'ı kaldırıp, sadece photo ve video kullanması sağlandı.
