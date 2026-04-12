Pod::Spec.new do |s|
  s.name             = 'ffmpeg-kit-full-gpl'
  s.version          = '6.0.2'
  s.summary          = 'FFmpeg Kit Full GPL'
  s.homepage         = 'https://github.com/arthenica/ffmpeg-kit'
  s.license          = { :type => 'LGPL-3.0', :file => 'LICENSE' }
  s.author           = { 'arthenica' => 'open-source@arthenica.com' }
  s.platform         = :ios, '12.1'
  s.source           = { :http => 'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl/releases/download/latest/ffmpeg-kit-ios-full-gpl-flat.zip' }

  s.vendored_frameworks = [
    'ffmpegkit.xcframework',
    'libavcodec.xcframework',
    'libavdevice.xcframework',
    'libavfilter.xcframework',
    'libavformat.xcframework',
    'libavutil.xcframework',
    'libswresample.xcframework',
    'libswscale.xcframework',
  ]

  s.header_dir          = 'ffmpegkit'
  s.preserve_paths      = ['**/*.xcframework/**']
end