const {
  withProjectBuildGradle,
  withAppBuildGradle,
  withPodfile,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const AAR_URL =
  'https://github.com/NooruddinLakhani/ffmpeg-kit-full-gpl/releases/download/v1.0.0/ffmpeg-kit-full-gpl.aar';
const AAR_FILENAME = 'ffmpeg-kit-full-gpl.aar';

// iOS: semihtrn4 zip — verified to contain 611 headers including FFmpegKitConfig.h
const IOS_ZIP_URL =
  'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl/releases/download/latest/ffmpeg-kit-ios-full-gpl-flat.zip';
// Flat zip — no subdirectory, xcframeworks are at root level (verified)
const IOS_SUBDIR = '';

// ─── 1. Root build.gradle ─────────────────────────────────────────────────────
const withRootBuildGradle = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    gradle = gradle.replace(/\n?\s*ffmpegKitPackage\s*=\s*["'].*["']\n?/g, '\n');
    if (!gradle.includes('ffmpeg-kit-full-gpl')) {
      gradle = gradle.replace(/repositories\s*\{/g, (match) =>
        match + `\n        flatDir { dirs "$rootDir/libs" }`
      );
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });

// ─── 2. app/build.gradle ─────────────────────────────────────────────────────
const withAppBuildGradlePatch = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('ffmpeg-kit-full-gpl')) return cfg;

    if (gradle.match(/^repositories\s*\{/m)) {
      gradle = gradle.replace(
        /^(repositories\s*\{)/m,
        `$1\n    flatDir { dirs "$rootDir/libs" }`
      );
    } else {
      gradle = gradle.replace(
        /^(dependencies\s*\{)/m,
        `repositories {\n    flatDir { dirs "$rootDir/libs" }\n}\n\n$1`
      );
    }

    gradle = gradle.replace(
      /^(dependencies\s*\{)/m,
      `$1\n    implementation(name: 'ffmpeg-kit-full-gpl', ext: 'aar')\n    implementation 'com.arthenica:smart-exception-java:0.2.1'`
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });

// ─── 3. ffmpeg-kit-react-native/android/build.gradle ─────────────────────────
const withFFmpegKitBuildGradlePatch = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      const ffmpegBuildGradle = path.join(
        cfg.modRequest.projectRoot,
        'node_modules/ffmpeg-kit-react-native/android/build.gradle'
      );

      if (!fs.existsSync(ffmpegBuildGradle)) {
        console.warn('[withFFmpegKit] ffmpeg-kit-react-native build.gradle not found, skipping');
        return cfg;
      }

      let contents = fs.readFileSync(ffmpegBuildGradle, 'utf8');
      const localDep = `implementation(name: 'ffmpeg-kit-full-gpl', ext: 'aar')`;

      if (contents.includes(localDep)) {
        console.log('[withFFmpegKit] Android build.gradle already patched');
        return cfg;
      }

      const replaced = contents.replace(
        /implementation\s+['"]com\.arthenica:ffmpeg-kit-[^\n]+/,
        localDep
      );

      if (replaced === contents) {
        console.warn('[withFFmpegKit] Could not find Maven dep line to patch');
        return cfg;
      }

      let patched = replaced;
      if (!patched.includes('flatDir')) {
        patched = patched.replace(
          /(repositories\s*\{[^}]*)\}/,
          `$1  flatDir {\n    dirs "\${rootProject.projectDir}/libs"\n  }\n}`
        );
      }

      fs.writeFileSync(ffmpegBuildGradle, patched, 'utf8');
      console.log('[withFFmpegKit] Patched Android build.gradle ✓');
      return cfg;
    },
  ]);

// ─── 4. Download AAR into android/libs/ ──────────────────────────────────────
const withDownloadAAR = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const libsDir = path.join(cfg.modRequest.projectRoot, 'android', 'libs');
      const aarDest = path.join(libsDir, AAR_FILENAME);

      if (!fs.existsSync(libsDir)) fs.mkdirSync(libsDir, { recursive: true });

      if (fs.existsSync(aarDest)) {
        const size = fs.statSync(aarDest).size;
        if (size > 1000000) {
          console.log(`[withFFmpegKit] ${AAR_FILENAME} already present (${(size / 1024 / 1024).toFixed(1)}MB), skipping`);
          return cfg;
        }
        fs.unlinkSync(aarDest);
        console.warn('[withFFmpegKit] Existing AAR too small, re-downloading...');
      }

      console.log(`[withFFmpegKit] Downloading ${AAR_FILENAME}...`);

      await new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');

        function get(url, dest, redirects) {
          if (redirects > 10) return reject(new Error('Too many redirects'));
          const proto = url.startsWith('https') ? https : http;
          const file = fs.createWriteStream(dest);

          proto.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              file.close();
              try { fs.unlinkSync(dest); } catch (_) { }
              return get(res.headers.location, dest, redirects + 1);
            }
            if (res.statusCode !== 200) {
              file.close();
              try { fs.unlinkSync(dest); } catch (_) { }
              return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                const size = fs.statSync(dest).size;
                console.log(`[withFFmpegKit] Downloaded ${AAR_FILENAME} (${(size / 1024 / 1024).toFixed(1)}MB) ✓`);
                resolve();
              });
            });
          }).on('error', (err) => {
            try { fs.unlinkSync(dest); } catch (_) { }
            reject(err);
          });
        }

        get(AAR_URL, aarDest, 0);
      });

      return cfg;
    },
  ]);

// ─── 5. iOS: Patch ffmpeg-kit-full-gpl.podspec → semihtrn4 zip ───────────────
// semihtrn4 zip contains 611 headers including FFmpegKitConfig.h (verified).
// jdarshan5 zip does NOT contain headers → causes 'FFmpegKitConfig.h not found'.
// NOTE: We patch inside android dangerousMod because it always runs regardless
// of whether ios/ folder exists. The podspec file is in node_modules (shared).
const withPatchFFmpegPodspec = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      const podspecPath = path.join(
        cfg.modRequest.projectRoot,
        'node_modules/ffmpeg-kit-react-native/ffmpeg-kit-full-gpl.podspec'
      );

      if (!fs.existsSync(podspecPath)) {
        console.warn('[withFFmpegKit] ffmpeg-kit-full-gpl.podspec not found, skipping');
        return cfg;
      }

      let contents = fs.readFileSync(podspecPath, 'utf8');

      if (contents.includes('semihtrn4')) {
        console.log('[withFFmpegKit] ffmpeg-kit-full-gpl.podspec already patched ✓');
        return cfg;
      }

      // Replace source URL → semihtrn4 zip (has headers)
      contents = contents.replace(
        /s\.source\s*=\s*\{[^}]+\}/,
        `s.source = { :http => "${IOS_ZIP_URL}" }`
      );

      // Replace vendored_frameworks paths → flat zip has no subdirectory
      contents = contents.replace(
        /s\.vendored_frameworks\s*=\s*\[[\s\S]*?\]/,
        `s.vendored_frameworks = [
    "ffmpegkit.xcframework",
    "libavcodec.xcframework",
    "libavdevice.xcframework",
    "libavfilter.xcframework",
    "libavformat.xcframework",
    "libavutil.xcframework",
    "libswresample.xcframework",
    "libswscale.xcframework",
  ]`
      );

      // Add HEADER_SEARCH_PATHS so FFmpegKitConfig.h is found at compile time
      if (!contents.includes('HEADER_SEARCH_PATHS')) {
        contents = contents.replace(
          /s\.static_framework\s*=\s*true/,
          `s.static_framework = true

  s.xcconfig = {
    'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/ffmpeg-kit-full-gpl/ffmpegkit.xcframework/ios-arm64/ffmpegkit.framework/Headers" "$(PODS_ROOT)/ffmpeg-kit-full-gpl/ffmpegkit.xcframework/ios-arm64_x86_64-simulator/ffmpegkit.framework/Headers"'
  }`
        );
      }

      fs.writeFileSync(podspecPath, contents, 'utf8');
      console.log('[withFFmpegKit] Patched ffmpeg-kit-full-gpl.podspec → semihtrn4 zip ✓');
      return cfg;
    },
  ]);

// ─── 6. iOS: Podfile patch ────────────────────────────────────────────────────
// Use :path => node_modules/ffmpeg-kit-react-native for BOTH pods.
// CocoaPods reads ffmpeg-kit-full-gpl.podspec from there (now patched to semihtrn4 zip).
const withFFmpegKitIos = (config) =>
  withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // Remove autolinking entry
    contents = contents.replace(
      /# @generated begin ffmpeg-kit-react-native-import[\s\S]*?# @generated end ffmpeg-kit-react-native-import\n?/m,
      ''
    );

    // Remove any old/conflicting ffmpeg pod entries
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-ios-full-gpl['"].*\n?/g, '');
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-full-gpl['"].*\n?/g, '');
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-react-native['"].*\n?/g, '');

    // Add correct pods
    contents = contents.replace(
      /^(target\s+['"].*['"]\s+do)/m,
      `$1\n  pod 'ffmpeg-kit-full-gpl', :path => '../node_modules/ffmpeg-kit-react-native'\n  pod 'ffmpeg-kit-react-native', :path => '../node_modules/ffmpeg-kit-react-native'`
    );

    cfg.modResults.contents = contents;
    return cfg;
  });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = (config) => {
  config = withRootBuildGradle(config);
  config = withAppBuildGradlePatch(config);
  config = withFFmpegKitBuildGradlePatch(config);
  config = withDownloadAAR(config);
  config = withPatchFFmpegPodspec(config); // ← patches podspec to semihtrn4 zip (has headers)
  config = withFFmpegKitIos(config);       // ← patches Podfile with correct :path =>
  return config;
};
