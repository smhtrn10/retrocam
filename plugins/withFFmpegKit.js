const { withAppBuildGradle, withProjectBuildGradle, withPodfile, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Android: inject ffmpegKitPackage into ROOT build.gradle ext block
const withFFmpegKitAndroid = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (!gradle.includes('ffmpegKitPackage')) {
      // inject into ext block if exists, otherwise add one
      if (gradle.includes('ext {')) {
        cfg.modResults.contents = gradle.replace(
          /ext\s*\{/,
          `ext {\n        ffmpegKitPackage = "video"`
        );
      } else {
        cfg.modResults.contents = gradle.replace(
          /^(allprojects|buildscript)/m,
          `ext {\n    ffmpegKitPackage = "video"\n}\n\n$1`
        );
      }
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
