Pod::Spec.new do |s|
  s.name         = 'ffmpeg-kit-ios-full-gpl'
  s.version      = '6.0'
  s.summary      = 'FFmpegKit iOS full-gpl with React Native bridge'
  s.homepage     = 'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl'
  s.license      = { :type => 'LGPL' }
  s.author       = { 'semihtrn4' => '' }
  s.platform     = :ios, '12.1'
  s.static_framework = true

  s.source = { :http => 'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl/releases/download/latest/ffmpeg-kit-ios-full-gpl-latest.zip' }

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

  s.dependency 'React-Core'

  s.source_files = '../node_modules/ffmpeg-kit-react-native/ios/FFmpegKitReactNativeModule.m',
                   '../node_modules/ffmpeg-kit-react-native/ios/FFmpegKitReactNativeModule.h'
end
