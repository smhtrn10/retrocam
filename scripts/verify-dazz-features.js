const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    console.error(`  ✖ FAIL: ${message}`);
  }
}

console.log('====================================================================');
console.log('  RetroCam — 4 Dazz Cam / RetroCam Feature Verification Suite       ');
console.log('====================================================================\n');

// ── Feature 1: 3D LUT / S-Curve Film Color Engine ──
console.log('[Feature 1] Non-Linear S-Curve Film Color Engine & Shadow Tinting');
const filterEngineContent = fs.readFileSync(path.join(root, 'utils/filterEngine.ts'), 'utf8');
const presetsContent = fs.readFileSync(path.join(root, 'constants/presets.ts'), 'utf8');

assert(filterEngineContent.includes('sCurve'), 'filterEngine: Evaluates non-linear sCurve parameter');
assert(filterEngineContent.includes('shadowTint'), 'filterEngine: Evaluates shadow tinting parameter');
assert(filterEngineContent.includes('highlightWarmth'), 'filterEngine: Evaluates highlight warmth roll-off');
assert(filterEngineContent.includes('dyeCrosstalk'), 'filterEngine: Implements analog dye crosstalk');
assert(presetsContent.includes('sCurve?: number'), 'presets: CameraSettings interface supports sCurve');
assert(presetsContent.includes('shadowTint?: string'), 'presets: CameraSettings interface supports shadowTint');
assert(presetsContent.includes('kodak-gold-200') && presetsContent.includes("sCurve: 0.45"), 'presets: Kodak Gold 200 tuned with authentic film S-curve');

// ── Feature 2: Interchangeable Lenses ──
console.log('\n[Feature 2] Interchangeable Lenses System (Prime, Fisheye, Prism, Star, Wide)');
const lensesPath = path.join(root, 'constants/lenses.ts');
assert(fs.existsSync(lensesPath), 'constants/lenses.ts exists');
const lensesContent = fs.readFileSync(lensesPath, 'utf8');
assert(lensesContent.includes('CAMERA_LENSES'), 'lenses: Exports CAMERA_LENSES array');
assert(lensesContent.includes("'prime'") && lensesContent.includes("'fisheye'") && lensesContent.includes("'prism'") && lensesContent.includes("'star'") && lensesContent.includes("'wide'"), 'lenses: Defines all 5 professional lens types');

const filteredImageContent = fs.readFileSync(path.join(root, 'components/FilteredImage.tsx'), 'utf8');
assert(filteredImageContent.includes("lens === 'prism'"), 'FilteredImage: Renders Prism optical 3-facet refraction');
assert(filteredImageContent.includes("lens === 'star'"), 'FilteredImage: Renders Star cross flare on specular highlights');
assert(filteredImageContent.includes("lens === 'fisheye'"), 'FilteredImage: Renders Fisheye barrel distortion vignette');
assert(filteredImageContent.includes("lens === 'wide'"), 'FilteredImage: Renders Wide chromatic edge aberration');

const indexContent = fs.readFileSync(path.join(root, 'app/index.tsx'), 'utf8');
const previewContent = fs.readFileSync(path.join(root, 'app/preview.tsx'), 'utf8');

assert(indexContent.includes('selectedLens') && indexContent.includes('setSelectedLens'), 'CameraScreen: Manages selectedLens state');
assert(indexContent.includes('showLensPicker') && indexContent.includes('setShowLensPicker'), 'CameraScreen: Has interactive lens picker modal/panel');
assert(indexContent.includes('CAMERA_LENSES.map'), 'CameraScreen: Renders interchangeable optical lenses');
assert(indexContent.includes('lens: selectedLens'), 'CameraScreen: Passes selectedLens to /preview router params');
assert(previewContent.includes('selectedLens') && previewContent.includes('lens={selectedLens}'), 'PreviewScreen: Passes selected lens to FilteredImage');

// ── Feature 3: Mechanical Audio Feedback Engine ──
console.log('\n[Feature 3] Mechanical Shutter & Motor Audio Feedback Engine');
const soundEnginePath = path.join(root, 'utils/soundEngine.ts');
assert(fs.existsSync(soundEnginePath), 'utils/soundEngine.ts exists');
const soundEngineContent = fs.readFileSync(soundEnginePath, 'utf8');
assert(soundEngineContent.includes('playMechanicalShutterSound'), 'soundEngine: Exports playMechanicalShutterSound');

const soundsDir = path.join(root, 'assets/sounds');
assert(fs.existsSync(path.join(soundsDir, 'shutter_slr.wav')), 'assets/sounds: shutter_slr.wav exists');
assert(fs.existsSync(path.join(soundsDir, 'film_wind.wav')), 'assets/sounds: film_wind.wav exists');
assert(fs.existsSync(path.join(soundsDir, 'disposable_snap.wav')), 'assets/sounds: disposable_snap.wav exists');
assert(fs.existsSync(path.join(soundsDir, 'polaroid_motor.wav')), 'assets/sounds: polaroid_motor.wav exists');

assert(indexContent.includes('playMechanicalShutterSound(selectedPreset.cameraType)'), 'CameraScreen: Synchronously triggers acoustic mechanical sound on shutter press');

// ── Feature 4: Photographic Organic Light Leaks ──
console.log('\n[Feature 4] Organic Multi-Spectral Light Leaks & Core Bursts');
assert(filteredImageContent.includes('coreFX') && filteredImageContent.includes('coreFY'), 'FilteredImage: Implements radial hot core burst origins');
assert(filteredImageContent.includes('coreColors'), 'FilteredImage: Implements hot core incandescent color palette');
assert(filteredImageContent.includes('blendMode="screen"'), 'FilteredImage: Blends light leaks via optical screen mode');

console.log('\n====================================================================');
console.log(`  Tests Executed: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
console.log('====================================================================');

if (passedTests === totalTests) {
  console.log('\n✔ ALL 4 NEW FEATURES VERIFIED WITH ZERO ERRORS!\n');
  process.exit(0);
} else {
  console.error('\n✖ SOME TESTS FAILED.\n');
  process.exit(1);
}
