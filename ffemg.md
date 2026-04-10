Senin İçin Doğru Çözüm: Kanıtlanmış Yol
İki uygulamanın ihtiyaçlarına bakarak en güvenli yolu seçelim:
 uygulama için de aynı paket kombinasyonu kullanılacak:
 
RetroCam
package.json:
json"ffmpeg-kit-react-native": "^6.0.2"
app.json — @config-plugins YOK, çünkü Podfile'ı manuel yönetiyoruz:
json{
  "expo": {
    "plugins": []
  }
}
ios/Podfile — target bloğu içine:
rubypod 'ffmpeg-kit-ios-full-gpl', :podspec => './ffmpeg-kit-ios-full-gpl.podspec'
pod 'ffmpeg-kit-react-native', :subspecs => ['video'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'
android/build.gradle — ext bloğuna:
gradleext {
  ffmpegKitPackage = "video"
}
video-preview.tsx:
typescriptimport { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

Stilz
package.json:
json"ffmpeg-kit-react-native": "^6.0.2"
ios/Podfile — target bloğu içine:
rubypod 'ffmpeg-kit-ios-full-gpl', :podspec => './ffmpeg-kit-ios-full-gpl.podspec'
pod 'ffmpeg-kit-react-native', :subspecs => ['full-gpl'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'
android/build.gradle — ext bloğuna:
gradleext {
  ffmpegKitPackage = "full-gpl"
}
import:
typescriptimport { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

Şimdi Podspec'i Yazıyorum
Projenin ios/ klasörüne ffmpeg-kit-ios-full-gpl.podspec adında dosya oluştur, içine şunu yaz:
1. ios/ffmpeg-kit-ios-full-gpl.podspec dosyası oluştur:
rubyPod::Spec.new do |s|
  s.name         = 'ffmpeg-kit-ios-full-gpl'
  s.version      = '6.0'
  s.summary      = 'FFmpegKit iOS full-gpl'
  s.homepage     = 'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl'
  s.license      = { :type => 'LGPL' }
  s.author       = { 'semihtrn4' => '' }
  s.platform     = :ios, '12.1'
  s.static_framework = true
  s.source       = { :http => 'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl/releases/download/latest/ffmpeg-kit-ios-full-gpl-latest.zip' }
  s.vendored_frameworks = [
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libswscale.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libswresample.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavutil.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavformat.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavfilter.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavdevice.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavcodec.xcframework',
    'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/ffmpegkit.xcframework'
  ]
end

2. ios/Podfile içine target bloğunun en üstüne ekle:
rubypod 'ffmpeg-kit-ios-full-gpl', :podspec => './ffmpeg-kit-ios-full-gpl.podspec'
pod 'ffmpeg-kit-react-native', :subspecs => ['full-gpl'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'


Bu iki dosyayı oluşturduktan sonra:
bashcd ios && pod install
Çalıştır ve sonucu söyle