/**
 * RetroCam Milestone 3 Empirical Verification & Stress Test Suite
 * Challenger 2: Shutter Flash Feedback & Viewfinder HUDs (Requirement R6 & R4 capture)
 */

const fs = require('fs');
const path = require('path');

const indexFile = path.resolve(__dirname, '../app/index.tsx');
const presetsFile = path.resolve(__dirname, '../constants/presets.ts');

const indexCode = fs.readFileSync(indexFile, 'utf8');
const presetsCode = fs.readFileSync(presetsFile, 'utf8');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testDetails = [];

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    testDetails.push({ status: 'PASS', description, details });
    console.log(`[PASS] ${description}`);
  } else {
    failedTests++;
    testDetails.push({ status: 'FAIL', description, details });
    console.error(`[FAIL] ${description} -> ${details}`);
  }
}

console.log('================================================================');
console.log('RETROCAM M3 EMPIRICAL CHALLENGER VERIFICATION SUITE');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────
// 1. Shutter Flash Animation Timing & Driver Verification
// ─────────────────────────────────────────────────────────────
console.log('--- 1. Shutter Flash Animation Timing & Driver ---');

// Check definition of shutterFlashOpacity
assert(
  'shutterFlashOpacity is initialized with Animated.Value(0)',
  /shutterFlashOpacity\s*=\s*useRef\(\s*new\s+Animated\.Value\(0\)\s*\)\.current/.test(indexCode)
);

// Check triggerShutterFlash resets to 0 before sequence
assert(
  'triggerShutterFlash resets opacity to 0 immediately before animating',
  /shutterFlashOpacity\.setValue\(0\)/.test(indexCode)
);

// Check sequence timing: 0 -> 1 in 35ms, 1 -> 0 in 105ms, total 140ms
const flashFnBody = indexCode.substring(
  indexCode.indexOf('const triggerShutterFlash = useCallback(() => {'),
  indexCode.indexOf('}, [shutterFlashOpacity]);')
);

const flashUpMatch = flashFnBody.match(/toValue:\s*1,\s*duration:\s*(\d+),\s*useNativeDriver:\s*true/);
const flashDownMatch = flashFnBody.match(/toValue:\s*0,\s*duration:\s*(\d+),\s*useNativeDriver:\s*true/);

assert(
  'Shutter flash ramp up duration is ~35ms with useNativeDriver: true',
  flashUpMatch !== null && parseInt(flashUpMatch[1], 10) === 35,
  `Found: ${flashUpMatch ? flashUpMatch[1] : 'null'}`
);

assert(
  'Shutter flash fade down duration is ~105ms with useNativeDriver: true',
  flashDownMatch !== null && parseInt(flashDownMatch[1], 10) === 105,
  `Found: ${flashDownMatch ? flashDownMatch[1] : 'null'}`
);

if (flashUpMatch && flashDownMatch) {
  const totalDuration = parseInt(flashUpMatch[1], 10) + parseInt(flashDownMatch[1], 10);
  assert(
    'Total shutter flash animation duration is exactly 140ms (~140ms spec)',
    totalDuration === 140,
    `Total duration: ${totalDuration}ms`
  );
}

// Check triggerShutterFlash is called synchronously at start of handleCapture
const captureBody = indexCode.substring(
  indexCode.indexOf('const handleCapture = useCallback(async () => {'),
  indexCode.indexOf('const handleGalleryImport')
);

const flashIdx = captureBody.indexOf('triggerShutterFlash()');
const takePictureIdx = captureBody.indexOf('cameraRef.current.takePictureAsync');

assert(
  'triggerShutterFlash() is invoked immediately on capture BEFORE awaiting takePictureAsync',
  flashIdx !== -1 && takePictureIdx !== -1 && flashIdx < takePictureIdx,
  `flashIdx=${flashIdx}, takePictureIdx=${takePictureIdx}`
);

assert(
  'Heavy haptic feedback triggers synchronously with shutter flash on capture',
  captureBody.includes('Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)')
);

// Check shutter flash overlay element and styles
assert(
  'Shutter flash Animated.View enforces pointerEvents="none"',
  /<Animated\.View[^>]*pointerEvents="none"[^>]*shutterFlashOverlay/.test(indexCode) ||
  /<Animated\.View[\s\S]*?pointerEvents="none"[\s\S]*?shutterFlashOverlay/.test(indexCode)
);

assert(
  'Shutter flash style defines white background and elevated zIndex',
  /shutterFlashOverlay:\s*\{[\s\S]*?backgroundColor:\s*'#FFFFFF'[\s\S]*?zIndex:\s*50/.test(indexCode)
);

// ─────────────────────────────────────────────────────────────
// 2. ViewfinderHud Component Classification & Preset Coverage
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. ViewfinderHud Component Classification Across Presets ---');

// Extract all presets from presets.ts
const presetIdMatches = [...presetsCode.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const camTypeMatches = [...presetsCode.matchAll(/cameraType:\s*'([^']+)'/g)].map(m => m[1]);
const frameTypeMatches = [...presetsCode.matchAll(/frameType:\s*'([^']+)'/g)].map(m => m[1]);

assert(
  'Parsed 50 distinct presets from constants/presets.ts',
  presetIdMatches.length === 50 && camTypeMatches.length === 50 && frameTypeMatches.length === 50,
  `Counts: ids=${presetIdMatches.length}, camTypes=${camTypeMatches.length}, frameTypes=${frameTypeMatches.length}`
);

const presets = presetIdMatches.map((id, i) => ({
  id,
  cameraType: camTypeMatches[i],
  frameType: frameTypeMatches[i],
}));

let camcorderCount = 0;
let digitalCount = 0;
let analog35mmCount = 0;
let halfFrameCount = 0;
let cleanCount = 0;
let multiClassificationCount = 0;

presets.forEach(p => {
  const isCamcorder = p.frameType === 'camcorder' || p.cameraType === 'camcorder' || p.cameraType === 'vhs';
  const isDigital = p.frameType === 'digital' || p.cameraType === 'digital-y2k';
  const isHalfFrame = p.frameType === 'half-frame' || p.cameraType === 'half-frame';
  const isAnalog35mm = !isHalfFrame && (p.cameraType === '35mm' || p.cameraType === 'disposable' || p.frameType === 'disposable');

  const modesActive = [isCamcorder, isDigital, isHalfFrame, isAnalog35mm].filter(Boolean).length;
  if (modesActive > 1) {
    multiClassificationCount++;
  }
  if (isCamcorder) camcorderCount++;
  if (isDigital) digitalCount++;
  if (isHalfFrame) halfFrameCount++;
  if (isAnalog35mm) analog35mmCount++;
  if (modesActive === 0) cleanCount++;
});

assert(
  'Mutual exclusivity: Zero presets are classified into multiple HUD modes',
  multiClassificationCount === 0,
  `Multi-classified count: ${multiClassificationCount}`
);

assert(
  'Camcorder HUD covers exactly all VHS & Camcorder presets (count: 5)',
  camcorderCount === 5,
  `Count: ${camcorderCount}`
);

assert(
  'Digital HUD covers exactly all Digital / Y2K presets (count: 6)',
  digitalCount === 6,
  `Count: ${digitalCount}`
);

assert(
  'Half-Frame HUD covers exactly all Half-Frame presets (count: 2)',
  halfFrameCount === 2,
  `Count: ${halfFrameCount}`
);

assert(
  '35mm / Disposable HUD covers exactly all 35mm & disposable film presets (count: 22)',
  analog35mmCount === 22,
  `Count: ${analog35mmCount}`
);

assert(
  'Non-HUD presets (Instant, 120, Cine 8/16mm, Fisheye) intentionally render clean preview (count: 15)',
  cleanCount === 15,
  `Count: ${cleanCount}`
);

assert(
  'Total presets accounted for is 50 (5 + 6 + 2 + 22 + 15)',
  camcorderCount + digitalCount + halfFrameCount + analog35mmCount + cleanCount === 50
);

// ─────────────────────────────────────────────────────────────
// 3. UI Element Verification per Viewfinder HUD Mode
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. UI Element Verification per Viewfinder HUD Mode ---');

// Mode 1: Camcorder elements
const hudCode = indexCode.substring(
  indexCode.indexOf('function ViewfinderHud('),
  indexCode.indexOf('export default function CameraScreen')
);

assert(
  'Camcorder mode: Implements blinking red REC badge with native driver Animated.loop',
  hudCode.includes('recBlinkAnim') &&
  hudCode.includes('Animated.loop') &&
  hudCode.includes('useNativeDriver: true') &&
  hudCode.includes('styles.hudRecDot') &&
  hudCode.includes('styles.hudRecText') &&
  hudCode.includes('>REC<')
);

assert(
  'Camcorder mode: Cleans up Animated loop blink on unmount / preset switch',
  hudCode.includes('blink.start()') && hudCode.includes('return () => blink.stop()')
);

assert(
  'Camcorder mode: Renders "SP  Hi8" format indicator text',
  hudCode.includes('>SP  Hi8<')
);

assert(
  'Camcorder mode: Renders battery gauge with segmented bars and nub',
  hudCode.includes('styles.hudBatteryRow') &&
  hudCode.includes('styles.hudBatteryBox') &&
  hudCode.includes('styles.hudBatterySegment') &&
  hudCode.includes('styles.hudBatteryNub')
);

assert(
  'Camcorder mode: Implements live timecode clock interval with clean-up',
  hudCode.includes('const [hudTime, setHudTime] = useState') &&
  hudCode.includes('setInterval') &&
  hudCode.includes('clearInterval(interval)') &&
  hudCode.includes('timecodeStr') &&
  hudCode.includes('TC ')
);

assert(
  'Camcorder mode: Renders zoom track with W / T indicators',
  hudCode.includes('styles.hudZoomTrack') &&
  hudCode.includes('>W<') &&
  hudCode.includes('>T<') &&
  hudCode.includes('styles.hudZoomIndicator')
);

// Mode 2: Digicam elements
assert(
  'Digicam mode: Renders "[+] AUTO" green exposure indicator',
  hudCode.includes('>[+] AUTO<') && hudCode.includes('styles.hudDigitalAuto')
);

assert(
  'Digicam mode: Renders "HQ 3.2M" resolution quality text',
  hudCode.includes('>HQ 3.2M<') && hudCode.includes('styles.hudDigitalQuality')
);

assert(
  'Digicam mode: Renders digital green battery gauge with fill and nub',
  hudCode.includes('styles.hudDigitalBatteryBox') &&
  hudCode.includes('styles.hudDigitalBatteryFill') &&
  hudCode.includes('styles.hudDigitalBatteryNub')
);

assert(
  'Digicam mode: Renders center AF target box',
  hudCode.includes('styles.hudDigitalCenterBox') &&
  hudCode.includes('styles.hudDigitalAfTarget')
);

assert(
  'Digicam mode: Renders "ISO 400" and "[ 128MB ]" storage indicators',
  hudCode.includes('>ISO 400<') &&
  hudCode.includes('>[ 128MB ]<') &&
  hudCode.includes('styles.hudDigitalIso') &&
  hudCode.includes('styles.hudDigitalStorage')
);

// Mode 3: 35mm / Disposable elements
assert(
  '35mm / Disposable mode: Renders glowing READY LED badge',
  hudCode.includes('styles.hudReadyBadge') &&
  hudCode.includes('styles.hudReadyLed') &&
  hudCode.includes('>READY<')
);

assert(
  '35mm / Disposable mode: Renders vintage frame counter badge "[ 24 ]"',
  hudCode.includes('styles.hudFrameCounterBadge') &&
  hudCode.includes('styles.hudFrameCounterText') &&
  hudCode.includes('>[ 24 ]<')
);

// Mode 4: Half-frame elements
assert(
  'Half-frame mode: Renders vertical split line with left: "50%"',
  indexCode.includes('hudHalfFrameSplitLine: {') &&
  /left:\s*'50%'/.test(indexCode) &&
  hudCode.includes('styles.hudHalfFrameSplitLine')
);

assert(
  'Half-frame mode: Renders FRAME 1 and FRAME 2 badges in top bar',
  hudCode.includes('>FRAME 1<') &&
  hudCode.includes('>FRAME 2<') &&
  hudCode.includes('styles.hudHalfFrameBadge')
);

assert(
  'Half-frame mode: Renders center dot marker',
  hudCode.includes('styles.hudHalfFrameCenterMarker') &&
  hudCode.includes('styles.hudHalfFrameCenterDot')
);

// ─────────────────────────────────────────────────────────────
// 4. PointerEvents Passthrough & Touch Non-Interference
// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. PointerEvents Passthrough & Touch Non-Interference ---');

assert(
  'ViewfinderHud outer container enforces pointerEvents="none"',
  /<View\s+style=\{StyleSheet\.absoluteFillObject\}\s+pointerEvents="none">/.test(hudCode)
);

assert(
  'Camcorder sub-wrapper enforces pointerEvents="none"',
  /isCamcorder\s*&&\s*\(\s*<View\s+style=\{StyleSheet\.absoluteFillObject\}\s+pointerEvents="none">/.test(hudCode)
);

assert(
  'Digicam sub-wrapper enforces pointerEvents="none"',
  /isDigital\s*&&\s*\(\s*<View\s+style=\{StyleSheet\.absoluteFillObject\}\s+pointerEvents="none">/.test(hudCode)
);

assert(
  '35mm / Disposable sub-wrapper enforces pointerEvents="none"',
  /isAnalog35mm\s*&&\s*\(\s*<View\s+style=\{StyleSheet\.absoluteFillObject\}\s+pointerEvents="none">/.test(hudCode)
);

assert(
  'Half-Frame sub-wrapper enforces pointerEvents="none"',
  /isHalfFrame\s*&&\s*\(\s*<View\s+style=\{StyleSheet\.absoluteFillObject\}\s+pointerEvents="none">/.test(hudCode)
);

// All viewfinder overlay layers check
const overlayLines = [
  { name: 'Tint overlay', regex: /tintOpacity\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Vignette overlay', regex: /vignette\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Light leak overlay', regex: /lightLeak\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Grain overlay', regex: /grain\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'RGB shift overlay', regex: /rgbShift\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Halation overlay', regex: /halation\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Flash overlay', regex: /flash\s*>\s*0[\s\S]*?pointerEvents="none"/ },
  { name: 'Focus brackets overlay', regex: /viewfinderFocusOverlay[\s\S]*?pointerEvents="none"/ },
  { name: 'Timestamp overlay', regex: /viewfinderTimestamp[\s\S]*?pointerEvents="none"/ },
  { name: 'Shutter flash overlay', regex: /shutterFlashOverlay[\s\S]*?pointerEvents="none"|pointerEvents="none"[\s\S]*?shutterFlashOverlay/ },
];

overlayLines.forEach(ov => {
  assert(
    `Overlay layer '${ov.name}' has pointerEvents="none"`,
    ov.regex.test(indexCode)
  );
});

// ─────────────────────────────────────────────────────────────
// 5. Architecture & Memory Leak Adversarial Checks
// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. Architecture & Memory Leak Adversarial Checks ---');

// Check that timecode state is encapsulated in ViewfinderHud, not in CameraScreen root
const cameraScreenCode = indexCode.substring(indexCode.indexOf('export default function CameraScreen'));
assert(
  'CameraScreen does NOT hold hudTime state (prevents full camera/shutter rerender every 1s)',
  !cameraScreenCode.includes('setHudTime') && !cameraScreenCode.includes('timecodeStr')
);

// Check that recBlinkAnim is cleanly scoped with useEffect cleanup
assert(
  'recBlinkAnim effect cleans up by calling blink.stop() on unmount',
  hudCode.includes('blink.stop()')
);

// Check that hudTime interval is cleanly scoped with useEffect cleanup
assert(
  'hudTime effect cleans up by calling clearInterval(interval) on unmount',
  hudCode.includes('clearInterval(interval)')
);

// Check aspect ratio navigation contract (Milestone 3 requirement R4)
assert(
  'handleCapture forwards aspectRatio in router.push to /preview (single exposure)',
  captureBody.includes("params: { uri: photo.uri, presetId: selectedPreset.id, aspectRatio }")
);

assert(
  'handleCapture forwards aspectRatio in router.push to /preview (double exposure)',
  captureBody.includes("params: { uri: photo.uri, secondaryUri: firstPhoto, presetId: selectedPreset.id, aspectRatio }")
);

const galleryBody = indexCode.substring(
  indexCode.indexOf('const handleGalleryImport = useCallback(async () => {'),
  indexCode.indexOf('const handleRandomCamera')
);

assert(
  'handleGalleryImport forwards aspectRatio in router.push to /preview (photo import)',
  galleryBody.includes("params: { uri: asset.uri, presetId: selectedPreset.id, aspectRatio, isImport: 'true' }")
);

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log(`VERDICT: ${failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log('================================================================');

process.exit(failedTests === 0 ? 0 : 1);
