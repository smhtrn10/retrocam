Pod::Spec.new do |s|
  s.name         = 'ffmpeg-kit-react-native'
  s.version      = '1.0.0'
  s.summary      = 'FFmpeg Kit React Native'
  s.homepage     = 'https://github.com/arthenica/ffmpeg-kit'
  s.license      = 'LGPL-3.0'
  s.authors      = { 'arthenica' => 'open-source@arthenica.com' }

  s.platform                = :ios, '13.0'
  s.ios.deployment_target   = '13.0'
  s.requires_arc            = true
  s.static_framework        = true

  s.source       = { :path => '../node_modules/ffmpeg-kit-react-native' }
  s.source_files = 'ios/FFmpegKitReactNativeModule.{m,h}'

  s.dependency 'React-Core'
  s.dependency 'ffmpeg-kit-full-gpl'
end