const {
  withProjectBuildGradle,
  withAppBuildGradle,
  withPodfile,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Self-hosted AAR (NooruddinLakhani's mirror of arthenica/ffmpeg-kit v6.0)
const AAR_URL =
  'https://github.com/NooruddinLakhani/ffmpeg-kit-full-gpl/releases/download/v1.0.0/ffmpeg-kit-full-gpl.aar';
const AAR_FILENAME = 'ffmpeg-kit-full-gpl.aar';

// ─── 1. Root build.gradle: add flatDir to ALL repositories blocks ─────────────
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

// ─── 2. app/build.gradle: add flatDir repo + local AAR dependency ────────────
const withAppBuildGradlePatch = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (gradle.includes('ffmpeg-kit-full-gpl')) {
      return cfg;
    }

    if (gradle.match(/^repositories\s*\{/m)) {
      gradle = gradle.replace(/^(repositories\s*\{)/m,
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

// ─── 3. Patch ffmpeg-kit-react-native/android/build.gradle ───────────────────
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

// ─── 4. Download AAR into android/libs/ ──────────────────────────────────────
const withDownloadAAR = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const libsDir = path.join(cfg.modRequest.projectRoot, 'android', 'libs');
      const aarDest = path.join(libsDir, AAR_FILENAME);

      if (!fs.existsSync(libsDir)) {
        fs.mkdirSync(libsDir, { recursive: true });
      }

      if (fs.existsSync(aarDest)) {
        const size = fs.statSync(aarDest).size;
        if (size > 1000000) {
          console.log(`[withFFmpegKit] ${AAR_FILENAME} already present (${(size/1024/1024).toFixed(1)}MB), skipping`);
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
              try { fs.unlinkSync(dest); } catch (_) {}
              return get(res.headers.location, dest, redirects + 1);
            }
            if (res.statusCode !== 200) {
              file.close();
              try { fs.unlinkSync(dest); } catch (_) {}
              return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
            }
            res.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                const size = fs.statSync(dest).size;
                console.log(`[withFFmpegKit] Downloaded ${AAR_FILENAME} (${(size/1024/1024).toFixed(1)}MB) ✓`);
                resolve();
              });
            });
          }).on('error', (err) => {
            try { fs.unlinkSync(dest); } catch (_) {}
            reject(err);
          });
        }

        get(AAR_URL, aarDest, 0);
      });

      return cfg;
    },
  ]);

// ─── 5. iOS: Podfile patch ────────────────────────────────────────────────────
const withFFmpegKitIos = (config) =>
  withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    contents = contents.replace(
      /# @generated begin ffmpeg-kit-react-native-import[\s\S]*?# @generated end ffmpeg-kit-react-native-import\n?/m,
      ''
    );

    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-ios-full-gpl['"].*\n?/g, '');

    if (
      !contents.includes("pod 'ffmpeg-kit-full-gpl'") &&
      !contents.includes('pod "ffmpeg-kit-full-gpl"')
    ) {
      contents = contents.replace(
        /^(target\s+['"].*['"]\s+do)/m,
        `$1\n  pod 'ffmpeg-kit-full-gpl', :path => '../node_modules/ffmpeg-kit-react-native'\n  pod 'ffmpeg-kit-react-native', :path => '../node_modules/ffmpeg-kit-react-native'`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

// ─── 6. iOS: ffmpeg-kit-full-gpl.podspec patch ───────────────────────────────
// bun install her çalıştığında node_modules üzerine yazılır.
// Bu adım prebuild sırasında podspec'i semihtrn4 zip'ine yönlendirir.
// semihtrn4 zip'i 611 header içeriyor (FFmpegKitConfig.h dahil) — jdarshan5 içermiyor.
// Zip içi yapı: ffmpeg-kit-ios-full-gpl/6.0-80adc/<framework>.xcframework
const withPatchFFmpegPodspec = (config) =>
  withDangerousMod(config, [
    'ios',
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

      const newUrl =
        'https://github.com/semihtrn4/ffmpeg-kit-ios-full-gpl/releases/download/latest/ffmpeg-kit-ios-full-gpl-latest.zip';
      const subdir = 'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc';

      // Zaten patch'lendiyse tekrar işlem yapma
      if (contents.includes('semihtrn4')) {
        console.log('[withFFmpegKit] ffmpeg-kit-full-gpl.podspec already patched ✓');
        return cfg;
      }

      // URL'i güncelle
      contents = contents.replace(
        /s\.source\s*=\s*\{[^}]+\}/,
        `s.source = { :http => "${newUrl}" }`
      );

      // vendored_frameworks path'lerini zip içi alt klasörle güncelle
      contents = contents.replace(
        /s\.vendored_frameworks\s*=\s*\[[\s\S]*?\]/,
        `s.vendored_frameworks = [
    "${subdir}/ffmpegkit.xcframework",
    "${subdir}/libavcodec.xcframework",
    "${subdir}/libavdevice.xcframework",
    "${subdir}/libavfilter.xcframework",
    "${subdir}/libavformat.xcframework",
    "${subdir}/libavutil.xcframework",
    "${subdir}/libswresample.xcframework",
    "${subdir}/libswscale.xcframework",
  ]`
      );

      fs.writeFileSync(podspecPath, contents, 'utf8');
      console.log('[withFFmpegKit] Patched ffmpeg-kit-full-gpl.podspec → semihtrn4 zip ✓');
      return cfg;
    },
  ]);

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = (config) => {
  config = withRootBuildGradle(config);
  config = withAppBuildGradlePatch(config);
  config = withFFmpegKitBuildGradlePatch(config);
  config = withDownloadAAR(config);
  config = withFFmpegKitIos(config);
  config = withPatchFFmpegPodspec(config); // ← YENİ: podspec'i semihtrn4 zip'ine yönlendirir
  return config;
};