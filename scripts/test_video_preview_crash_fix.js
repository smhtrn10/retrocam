const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
  }
}

console.log('\n============================================================');
console.log('   VideoPreviewScreen Crash Fix Verification Suite          ');
console.log('============================================================\n');

// 1. Transpile and load constants/presets.ts
const presetsTsPath = path.resolve(__dirname, '../constants/presets.ts');
const presetsTsCode = fs.readFileSync(presetsTsPath, 'utf8');

const presetsTranspiled = babel.transformSync(presetsTsCode, {
  filename: 'presets.ts',
  presets: [
    ['@babel/preset-typescript', { isTSX: false, allExtensions: true }],
  ],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

const presetsModule = { exports: {} };
const fnPresets = new Function('module', 'exports', 'require', presetsTranspiled);
fnPresets(presetsModule, presetsModule.exports, require);

assert(typeof presetsModule.exports.isPresetLocked === 'function', 'constants/presets.ts exports isPresetLocked as function');
assert(Array.isArray(presetsModule.exports.CAMERA_PRESETS), 'constants/presets.ts exports CAMERA_PRESETS');

// 2. Transpile and load utils/presets.ts
const utilsPresetsTsPath = path.resolve(__dirname, '../utils/presets.ts');
const utilsPresetsTsCode = fs.readFileSync(utilsPresetsTsPath, 'utf8');

const utilsPresetsTranspiled = babel.transformSync(utilsPresetsTsCode, {
  filename: 'presets.ts',
  presets: [
    ['@babel/preset-typescript', { isTSX: false, allExtensions: true }],
  ],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

const utilsPresetsModule = { exports: {} };
const fnUtilsPresets = new Function('module', 'exports', 'require', utilsPresetsTranspiled);
fnUtilsPresets(utilsPresetsModule, utilsPresetsModule.exports, (id) => {
  if (id === '@/constants/presets' || id.endsWith('constants/presets')) {
    return presetsModule.exports;
  }
  return require(id);
});

assert(typeof utilsPresetsModule.exports.isPresetLocked === 'function', 'utils/presets.ts exports isPresetLocked as function');

// 3. Functional behavior check
const mockFreePreset = { id: 'classic-35', isPro: false, name: 'Classic 35' };
const mockProPreset = { id: 'pro-gold', isPro: true, name: 'Pro Gold' };

assert(presetsModule.exports.isPresetLocked(mockFreePreset, false) === false, 'Free preset unlocked for non-pro (constants)');
assert(presetsModule.exports.isPresetLocked(mockProPreset, false) === true, 'Pro preset locked for non-pro (constants)');
assert(presetsModule.exports.isPresetLocked(mockProPreset, true) === false, 'Pro preset unlocked for pro (constants)');

assert(utilsPresetsModule.exports.isPresetLocked(mockFreePreset, false) === false, 'Free preset unlocked for non-pro (utils)');
assert(utilsPresetsModule.exports.isPresetLocked(mockProPreset, false) === true, 'Pro preset locked for non-pro (utils)');
assert(utilsPresetsModule.exports.isPresetLocked(mockProPreset, true) === false, 'Pro preset unlocked for pro (utils)');

// Test across all CAMERA_PRESETS
let lockedCountNonPro = 0;
let lockedCountPro = 0;
for (const p of presetsModule.exports.CAMERA_PRESETS) {
  const isLockedConst = presetsModule.exports.isPresetLocked(p, false);
  const isLockedUtil = utilsPresetsModule.exports.isPresetLocked(p, false);
  assert(isLockedConst === isLockedUtil, `Preset ${p.id} consistency across both modules`);
  if (isLockedConst) lockedCountNonPro++;
  if (presetsModule.exports.isPresetLocked(p, true)) lockedCountPro++;
}
assert(lockedCountNonPro > 0, `Non-pro user has some locked presets (${lockedCountNonPro})`);
assert(lockedCountPro === 0, 'Pro user has zero locked presets');

// 4. Inspect app/video-preview.tsx AST & imports
const videoPreviewPath = path.resolve(__dirname, '../app/video-preview.tsx');
const videoPreviewCode = fs.readFileSync(videoPreviewPath, 'utf8');

// Ensure isPresetLocked is imported
assert(videoPreviewCode.includes('isPresetLocked'), 'app/video-preview.tsx references isPresetLocked');

// Ensure isPresetLocked is NOT imported from a module that doesn't export it
const ast = babel.parseSync(videoPreviewCode, {
  filename: 'video-preview.tsx',
  presets: [
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ],
});

let isPresetLockedImportSource = null;
let constantsImportedSpecifiers = [];
let utilsImportedSpecifiers = [];

ast.program.body.forEach((node) => {
  if (node.type === 'ImportDeclaration') {
    const src = node.source.value;
    node.specifiers.forEach((spec) => {
      const importedName = spec.imported ? spec.imported.name : spec.local.name;
      if (importedName === 'isPresetLocked') {
        isPresetLockedImportSource = src;
      }
      if (src === '@/constants/presets') {
        constantsImportedSpecifiers.push(importedName);
      }
      if (src === '@/utils/presets') {
        utilsImportedSpecifiers.push(importedName);
      }
    });
  }
});

assert(Boolean(isPresetLockedImportSource), 'isPresetLocked is explicitly imported');
console.log(`  [INFO] isPresetLocked imported from: ${isPresetLockedImportSource}`);

// Verify all value specifiers imported from @/constants/presets exist (ignoring pure type imports like CameraPreset)
constantsImportedSpecifiers.forEach((name) => {
  if (name === 'CameraPreset') return; // Type-only import
  assert(presetsModule.exports[name] !== undefined, `constants/presets export '${name}' is defined`);
});

// Verify all specifiers imported from @/utils/presets exist
utilsImportedSpecifiers.forEach((name) => {
  assert(utilsPresetsModule.exports[name] !== undefined, `utils/presets export '${name}' is defined`);
});

// 5. Simulate VideoPreviewScreen mount preset lock check
const initialPreset = presetsModule.exports.CAMERA_PRESETS[0];
try {
  const isLocked1 = utilsPresetsModule.exports.isPresetLocked(initialPreset, false);
  const isLocked2 = presetsModule.exports.isPresetLocked(initialPreset, false);
  assert(typeof isLocked1 === 'boolean' && typeof isLocked2 === 'boolean', 'isPresetLocked evaluation returns valid boolean on mount simulation');
} catch (err) {
  assert(false, 'Mount simulation threw runtime error', err.message);
}

console.log('\n============================================================');
console.log(`   Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log('============================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
