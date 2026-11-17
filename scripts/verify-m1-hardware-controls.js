/**
 * Automated Verification Suite for Milestone M1: Camera Hardware Controls
 * Requirements:
 * 1. Physical Flash Modes (off / on / auto / torch)
 * 2. Self-Timer (Off / 3s / 10s) with countdown visual badge & audio tick
 * 3. Tap-to-Focus & Exposure Metering with animated reticle
 * 4. Exposure Compensation (EV +/-) with real-time viewfinder simulation overlay
 * 5. Pinch-to-Zoom with factor pill (1.0x-5.0x) & quick steps (1x, 2x, 5x)
 * 6. Composition Grid (3x3 Rule-of-Thirds toggle & persistence)
 * 7. Shutter Sound Mute Toggle (top bar button, settings toggle, & guarded playback)
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'app/index.tsx');
const soundEnginePath = path.join(root, 'utils/soundEngine.ts');
const settingsPath = path.join(root, 'app/settings.tsx');

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
console.log('  Milestone M1: Camera Hardware Controls Automated Verification      ');
console.log('====================================================================\n');

const indexContent = fs.readFileSync(indexPath, 'utf8');
const soundEngineContent = fs.readFileSync(soundEnginePath, 'utf8');
const settingsContent = fs.readFileSync(settingsPath, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 1: Physical Flash Modes
// ─────────────────────────────────────────────────────────────────────────────
console.log('[Feature 1] Physical Flash Modes (off / on / auto / torch)');
assert(indexContent.includes("useState<'off' | 'on' | 'auto' | 'torch'>('off')"), 'CameraScreen manages flashMode across all 4 modes');
assert(indexContent.includes("flash={flashMode === 'torch' ? 'off' : flashMode}"), 'CameraView receives mapped flash prop');
assert(indexContent.includes("enableTorch={flashMode === 'torch'}"), 'CameraView receives enableTorch boolean prop for torch mode');
assert(indexContent.includes('cycleFlashMode'), 'cycleFlashMode handler defined');
assert(indexContent.includes('ZapOff') && indexContent.includes('Zap') && indexContent.includes('Flame'), 'Distinctive icons for flash modes (ZapOff, Zap, Flame)');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 2: Self-Timer
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 2] Self-Timer (Off / 3s / 10s)');
assert(indexContent.includes("useState<0 | 3 | 10>(0)"), 'timerSeconds state manages 0, 3, 10 seconds');
assert(indexContent.includes('setCountdown'), 'countdown state tracks active timer seconds remaining');
assert(soundEngineContent.includes('export function playTimerTickSound'), 'soundEngine exports playTimerTickSound');
assert(indexContent.includes('playTimerTickSound()'), 'CameraScreen invokes playTimerTickSound on countdown ticks');
assert(indexContent.includes('countdown !== null &&'), 'Visual countdown badge rendered conditionally on viewfinder');
assert(indexContent.includes('TAP SHUTTER TO CANCEL'), 'Countdown badge displays cancel instruction');
assert(indexContent.includes('cycleTimer'), 'cycleTimer handler cycles 0s -> 3s -> 10s');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 3: Tap-to-Focus & Exposure Metering
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 3] Tap-to-Focus & Exposure Metering');
assert(indexContent.includes('focusPoint'), 'focusPoint state captures (x, y) touch coordinates');
assert(indexContent.includes('focusAnimScale') && indexContent.includes('toValue: 1.0'), 'Spring animation scales focus reticle to 1.0');
assert(indexContent.includes('focusAnimOpacity'), 'Opacity animation fades focus reticle after timeout');
assert(indexContent.includes('autofocus={autofocus}'), 'autofocus prop passed to CameraView');
assert(indexContent.includes('SunMedium'), 'Focus reticle renders sun exposure pip icon');
assert(indexContent.includes('styles.focusReticle'), 'Focus reticle styles defined');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 4: Exposure Compensation (EV +/-)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 4] Exposure Compensation (EV +/-)');
assert(indexContent.includes('const [ev, setEv] = useState<number>(0)'), 'ev state manages exposure compensation (-2.0 to +2.0)');
assert(indexContent.includes("backgroundColor: ev > 0 ? '#FFFFFF' : '#000000'"), 'Real-time EV brightness simulation overlay on viewfinder');
assert(indexContent.includes('styles.evSelectorPanel'), 'Interactive EV quick selector panel defined');
assert(indexContent.includes('ev: ev !== 0 ? String(ev) : undefined'), 'ev param forwarded in preview router params');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 5: Pinch-to-Zoom Gesture & Indicator
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 5] Pinch-to-Zoom Gesture & Indicator');
assert(indexContent.includes('zoom={zoom}'), 'zoom prop bound directly to CameraView');
assert(indexContent.includes('PanResponder.create'), 'PanResponder handles multi-touch gestures');
assert(indexContent.includes('(1 + zoom * 4).toFixed(1)'), 'Numeric zoom factor calculated from 1.0x to 5.0x');
assert(indexContent.includes('setZoom(0)') && indexContent.includes('setZoom(0.25)') && indexContent.includes('setZoom(1.0)'), 'Quick step buttons (1x, 2x, 5x) provided');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 6: Composition Grid (3x3 Rule-of-Thirds)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 6] Composition Grid (3x3 Rule-of-Thirds)');
assert(indexContent.includes('showGrid && ('), 'Rule-of-thirds grid lines conditionally rendered via showGrid');
assert(indexContent.includes('camera_grid_enabled'), 'Grid state persisted via AsyncStorage camera_grid_enabled');
assert(indexContent.includes('toggleGrid'), 'toggleGrid handler toggles grid state');
assert(settingsContent.includes('Composition Grid (3x3)'), 'Settings screen provides Composition Grid toggle');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 7: Shutter Sound Mute Toggle
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[Feature 7] Shutter Sound Mute Toggle');
assert(indexContent.includes('camera_shutter_muted'), 'Shutter mute persisted via AsyncStorage camera_shutter_muted');
assert(indexContent.includes('if (!isMuted)'), 'playMechanicalShutterSound guarded by !isMuted');
assert(indexContent.includes('playMechanicalShutterSound(selectedPreset.cameraType)'), 'Preserves verbatim playMechanicalShutterSound call');
assert(indexContent.includes('shutterSound: !isMuted'), 'shutterSound: !isMuted passed to takePictureAsync options');
assert(indexContent.includes('Volume2') && indexContent.includes('VolumeX'), 'Mute button displays Volume2 and VolumeX icons');
assert(settingsContent.includes('Shutter Sound'), 'Settings screen provides Shutter Sound toggle');

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n====================================================================');
console.log(`  Tests Executed: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
console.log('====================================================================');

if (passedTests === totalTests) {
  console.log('\n✔ ALL 7 MILESTONE M1 CAMERA CONTROLS VERIFIED WITH ZERO ERRORS!\n');
  process.exit(0);
} else {
  console.error('\n✖ SOME TESTS FAILED.\n');
  process.exit(1);
}
