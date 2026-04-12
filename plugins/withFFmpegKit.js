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
        console.log('[withFFmpegKit] build.gradle already patched');
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
      console.log('[withFFmpegKit] Patched ffmpeg-kit-react-native build.gradle ✓');
      return cfg;
    },
  ]);

// ─── 4. Download AAR ──────────────────────────────────────────────────────────
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

// ─── 5. iOS: Podfile patch + podspec patch ────────────────────────────────────
const withFFmpegKitIos = (config) =>
  withPodfile(config, (cfg) => {
    // Podspec patch burada yap
    const podspecPath = path.join(
      cfg.modRequest.projectRoot,
      'node_modules/ffmpeg-kit-react-native/ffmpeg-kit-react-native.podspec'
    );

    if (fs.existsSync(podspecPath)) {
      let podspec = fs.readFileSync(podspecPath, 'utf8');
      if (!podspec.includes('patched-by-withFFmpegKit')) {
        podspec = podspec.replace(
          /s\.source\s*=\s*\{[^}]+\}/,
          `s.source = { :path => '.' } # patched-by-withFFmpegKit`
        );
        podspec = podspec.replace(
          /s\.dependency\s+['"]ffmpeg-kit-full-gpl['"][^\n]*/,
          `s.dependency 'ffmpeg-kit-full-gpl'\n  s.pod_target_xcconfig = { 'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/ffmpeg-kit-full-gpl/ffmpegkit.xcframework/ios-arm64/ffmpegkit.framework/Headers" "$(PODS_ROOT)/ffmpeg-kit-full-gpl/ffmpegkit.xcframework/ios-arm64_x86_64-simulator/ffmpegkit.framework/Headers"' }`
        );
        fs.writeFileSync(podspecPath, podspec, 'utf8');
        console.log('[withFFmpegKit] Patched ffmpeg-kit-react-native.podspec ✓');
      } else {
        console.log('[withFFmpegKit] ffmpeg-kit-react-native.podspec already patched ✓');
      }
    }

    // Podfile patch
    let contents = cfg.modResults.contents;

    contents = contents.replace(
      /# @generated begin ffmpeg-kit-react-native-import[\s\S]*?# @generated end ffmpeg-kit-react-native-import\n?/m,
      ''
    );

    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-ios-full-gpl['"].*\n?/g, '');
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-full-gpl['"][^,\n]*.*\n?/g, '');
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-react-native['"][^,\n]*.*\n?/g, '');

    contents = contents.replace(
      /^(target\s+['"].*['"]\s+do)/m,
      `$1
  pod 'ffmpeg-kit-full-gpl', :path => '..'
  pod 'ffmpeg-kit-react-native', :path => '../node_modules/ffmpeg-kit-react-native'`
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
  config = withFFmpegKitIos(config);
  return config;
};