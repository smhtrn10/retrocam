const { withPodfile, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Copies the podspec into ios/ and patches Podfile
const withFFmpegKitIos = (config) => {
  // Step 1: Copy podspec file into ios/
  config = withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const iosDir = path.join(cfg.modRequest.platformProjectRoot);
      const src = path.join(__dirname, '..', 'ios', 'ffmpeg-kit-ios-full-gpl.podspec');
      const dest = path.join(iosDir, 'ffmpeg-kit-ios-full-gpl.podspec');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
      return cfg;
    },
  ]);

  // Step 2: Patch Podfile
  config = withPodfile(config, (cfg) => {
    const podfile = cfg.modResults;
    const injection = `
  pod 'ffmpeg-kit-ios-full-gpl', :podspec => './ffmpeg-kit-ios-full-gpl.podspec'
  pod 'ffmpeg-kit-react-native', :subspecs => ['video'], :podspec => '../node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'
`;
    if (!podfile.contents.includes('ffmpeg-kit-ios-full-gpl')) {
      // Insert after the first 'target' line
      cfg.modResults.contents = podfile.contents.replace(
        /^(target\s+['"].*['"]\s+do)/m,
        `$1\n${injection}`
      );
    }
    return cfg;
  });

  return config;
};

module.exports = withFFmpegKitIos;
