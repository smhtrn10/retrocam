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
// Expo 54 does NOT generate allprojects{} — we inject flatDir wherever
// repositories{} appears so both root and subproject scopes are covered.
const withRootBuildGradle = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    // Remove legacy ffmpegKitPackage ext if present
    gradle = gradle.replace(/\n?\s*ffmpegKitPackage\s*=\s*["'].*["']\n?/g, '\n');

    // Inject flatDir into every repositories{} block that doesn't already have it
    if (!gradle.includes('ffmpeg-kit-full-gpl')) {
      gradle = gradle.replace(/repositories\s*\{/g, (match) =>
        match + `\n        flatDir { dirs "$rootDir/libs" }`
      );
    }

    cfg.modResults.contents = gradle;
    return cfg;
  });

// ─── 2. app/build.gradle: add flatDir repo + local AAR dependency ────────────
// flatDir must be in the TOP-LEVEL repositories{} block, NOT inside android{}.
// Gradle 8.x does not support repositories inside android{}.
const withAppBuildGradlePatch = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (gradle.includes('ffmpeg-kit-full-gpl')) {
      return cfg; // already patched
    }

    // Add flatDir to the top-level repositories block
    // If no top-level repositories block exists, add one before dependencies
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

    // Add AAR + smart-exception to dependencies
    gradle = gradle.replace(
      /^(dependencies\s*\{)/m,
      `$1\n    implementation(name: 'ffmpeg-kit-full-gpl', ext: 'aar')\n    implementation 'com.arthenica:smart-exception-java:0.2.1'`
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });

// ─── 3. Patch ffmpeg-kit-react-native/android/build.gradle ───────────────────
// Replace Maven dep line with local AAR reference.
// Also ensure flatDir is present in its repositories block.
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

      // Match the dynamic Maven dep line (single or double quotes, with string concat)
      const replaced = contents.replace(
        /implementation\s+['"]com\.arthenica:ffmpeg-kit-[^\n]+/,
        localDep
      );

      if (replaced === contents) {
        console.warn('[withFFmpegKit] Could not find Maven dep line to patch');
        return cfg;
      }

      // Ensure flatDir is in the last repositories{} block
      let patched = replaced;
      if (!patched.includes('flatDir')) {
        // Insert before the final closing } of the last repositories block
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
        if (size > 1000000) { // > 1MB means it's a real AAR
          console.log(`[withFFmpegKit] ${AAR_FILENAME} already present (${(size/1024/1024).toFixed(1)}MB), skipping`);
          return cfg;
        }
        // File exists but too small — corrupted, delete and re-download
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
// Use :path => pointing to node_modules/ffmpeg-kit-react-native.
// CocoaPods reads ffmpeg-kit-full-gpl.podspec from there, which downloads
// jdarshan5's xcframework zip (200 OK, verified).
// Avoids URI::BadURIError from CocoaPods 1.16.x with local :podspec => paths.
const withFFmpegKitIos = (config) =>
  withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // Remove autolinking entry to avoid duplicate pod declaration
    contents = contents.replace(
      /# @generated begin ffmpeg-kit-react-native-import[\s\S]*?# @generated end ffmpeg-kit-react-native-import\n?/m,
      ''
    );

    // Remove any legacy :podspec => local path entries
    contents = contents.replace(/\n?\s*pod ['"]ffmpeg-kit-ios-full-gpl['"].*\n?/g, '');

    // Add pods if not already present
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

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = (config) => {
  config = withRootBuildGradle(config);
  config = withAppBuildGradlePatch(config);
  config = withFFmpegKitBuildGradlePatch(config);
  config = withDownloadAAR(config);
  config = withFFmpegKitIos(config);
  return config;
};
