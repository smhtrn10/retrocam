const { withAppBuildGradle, withPodfile, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Android: inject ffmpegKitPackage into build.gradle
const withFFmpegKitAndroid = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (!gradle.includes('ffmpegKitPackage')) {
      cfg.modResults.contents = gradle.replace(
        /android\s*\{/,
        `android {\n    defaultConfig {\n        buildConfigField "String", "ffmpegKitPackage", "\\"video\\""\n    }`
      );
    }
    return cfg;
  });
};

// iOS: copy podspec + patch Podfile
const withFFmpegKitIos = (config) => {
  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = cfg.modRequest.platformProjectRoot;
      const src = path.join(__dirname, '..', 'ios', 'ffmpeg-kit-ios-full-gpl.podspec');
      const dest = path.join(iosDir, 'ffmpeg-kit-ios-full-gpl.podspec');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
      return cfg;
    },
  ]);

  config = withPodfile(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (!contents.includes('ffmpeg-kit-ios-full-gpl')) {
      cfg.modResults.contents = contents.replace(
        /^(target\s+['"].*['"]\s+do)/m,
        `$1\n  pod 'ffmpeg-kit-ios-full-gpl', :podspec => './ffmpeg-kit-ios-full-gpl.podspec'\n  pod 'ffmpeg-kit-react-native', :subspecs => ['video'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'`
      );
    }
    return cfg;
  });

  return config;
};

module.exports = (config) => {
  config = withFFmpegKitAndroid(config);
  config = withFFmpegKitIos(config);
  return config;
};
