const { withProjectBuildGradle, withPodfile } = require('@expo/config-plugins');

// Android: inject ffmpegKitPackage = "full-gpl" into ROOT build.gradle ext block
// The jdarshan5 package's build.gradle reads this and downloads the correct AAR from Maven Central
const withFFmpegKitAndroid = (config) => {
  return withProjectBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (!gradle.includes('ffmpegKitPackage')) {
      if (gradle.includes('ext {')) {
        cfg.modResults.contents = gradle.replace(
          /ext\s*\{/,
          `ext {\n        ffmpegKitPackage = "full-gpl"`
        );
      } else {
        cfg.modResults.contents = gradle.replace(
          /^(allprojects|buildscript)/m,
          `ext {\n    ffmpegKitPackage = "full-gpl"\n}\n\n$1`
        );
      }
    }
    return cfg;
  });
};

// iOS: patch Podfile to use jdarshan5's local podspecs
// - ffmpeg-kit-full-gpl.podspec downloads ~64MB binary from jdarshan5's GitHub release
// - ffmpeg-kit-react-native.podspec provides the RN bridge (FFmpegKitReactNativeModule)
const withFFmpegKitIos = (config) => {
  config = withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // Remove autolinking entry to avoid duplicate pod declaration
    contents = contents.replace(
      /# @generated begin ffmpeg-kit-react-native-import[\s\S]*?# @generated end ffmpeg-kit-react-native-import\n?/m,
      ''
    );

    if (!contents.includes('ffmpeg-kit-react-native')) {
      contents = contents.replace(
        /^(target\s+['"].*['"]\s+do)/m,
        `$1\n  pod 'ffmpeg-kit-full-gpl', :path => '../node_modules/ffmpeg-kit-react-native'\n  pod 'ffmpeg-kit-react-native', :path => '../node_modules/ffmpeg-kit-react-native'`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

  return config;
};

module.exports = (config) => {
  config = withFFmpegKitAndroid(config);
  config = withFFmpegKitIos(config);
  return config;
};
