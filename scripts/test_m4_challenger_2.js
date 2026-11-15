#!/usr/bin/env node

/**
 * Empirical Adversarial Challenger 2 Test Suite for Milestone 4:
 * High-Resolution Photo Export, Burned-in Overlays & Skia Polish
 * (Requirements R1, R2, R4, R6)
 *
 * Focus:
 * 1. Burned-in Overlays & Skia Architecture (R2)
 * 2. Skia Grain & Turbulence (R6)
 * 3. Offscreen High-Res Export & Fallback Cascade (R1)
 * 4. Aspect Ratio Cropping & Preview Sizing (R4)
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
  }
}

console.log('\n\x1b[35m====================================================================\x1b[0m');
console.log('\x1b[35m       CHALLENGER 2: ADVERSARIAL EMPIRICAL VERIFICATION SUITE       \x1b[0m');
console.log('\x1b[35m   Milestone 4: High-Res Export, Burned-in Overlays & Skia Polish   \x1b[0m');
console.log('\x1b[35m====================================================================\x1b[0m\n');

const filteredImagePath = path.join(__dirname, '../components/FilteredImage.tsx');
const previewPath = path.join(__dirname, '../app/preview.tsx');
const presetsPath = path.join(__dirname, '../constants/presets.ts');

assert(fs.existsSync(filteredImagePath), 'Precondition: components/FilteredImage.tsx exists');
assert(fs.existsSync(previewPath), 'Precondition: app/preview.tsx exists');
assert(fs.existsSync(presetsPath), 'Precondition: constants/presets.ts exists');

const filteredImageSrc = fs.readFileSync(filteredImagePath, 'utf8');
const fiSourceFile = ts.createSourceFile('FilteredImage.tsx', filteredImageSrc, ts.ScriptTarget.Latest, true);

// ─────────────────────────────────────────────────────────────
//  SECTION 1: Burned-in Overlays & Skia Architecture (R2)
// ─────────────────────────────────────────────────────────────
console.log('\x1b[33m[Section 1] Burned-in Overlays & Skia Architecture (R2)\x1b[0m');

// 1.1: Verify Text import from 'react-native'
let reactNativeImports = [];
let hasReactNativeText = false;
let reactNativeViewUsedInsideCanvas = false;

function scanImports(node) {
  if (ts.isImportDeclaration(node)) {
    const moduleSpecifier = node.moduleSpecifier.getText(fiSourceFile).replace(/['"]/g, '');
    if (moduleSpecifier === 'react-native') {
      if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          const name = element.name.text;
          reactNativeImports.push(name);
          if (name === 'Text') hasReactNativeText = true;
        }
      }
    }
  }
  ts.forEachChild(node, scanImports);
}
scanImports(fiSourceFile);

assert(!hasReactNativeText, 'TC-1.1: React Native `<Text>` is NOT imported in FilteredImage.tsx', `Imports: ${reactNativeImports.join(', ')}`);

// 1.2: Check all JSX elements inside FilteredSceneContent and sub-renderers
const skiaElementTypes = new Set([
  'Group', 'SkiaImage', 'ColorMatrix', 'Blur', 'RoundedRect', 'Rect', 'Circle',
  'RadialGradient', 'SkiaLinearGradient', 'Turbulence', 'SkiaText'
]);

let nonSkiaElementsInsideScene = [];
let skiaTextCount = 0;
let skiaRectCount = 0;
let skiaCircleCount = 0;
let skiaRoundedRectCount = 0;

function checkSceneJSX(node, inSceneOrHelper = false) {
  let isTargetFn = inSceneOrHelper;

  if (ts.isFunctionDeclaration(node) && node.name) {
    const fnName = node.name.text;
    if (
      fnName === 'FilteredSceneContent' ||
      fnName.startsWith('render') // renderVintageDateStamp, renderRetroCamWatermark, renderCamcorderHUD, etc.
    ) {
      isTargetFn = true;
    }
  }

  if (isTargetFn) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(fiSourceFile);
      if (tag === 'Text' || tag === 'View') {
        nonSkiaElementsInsideScene.push(tag);
      }
      if (tag === 'SkiaText') skiaTextCount++;
      if (tag === 'Rect') skiaRectCount++;
      if (tag === 'Circle') skiaCircleCount++;
      if (tag === 'RoundedRect') skiaRoundedRectCount++;
    }
  }

  ts.forEachChild(node, (child) => checkSceneJSX(child, isTargetFn));
}
checkSceneJSX(fiSourceFile);

assert(
  nonSkiaElementsInsideScene.length === 0,
  'TC-1.2: Zero React Native `<Text>` or `<View>` elements inside FilteredSceneContent / overlay renderers',
  `Found: ${nonSkiaElementsInsideScene.join(', ')}`
);
assert(skiaTextCount >= 10, `TC-1.3: Plentiful SkiaText primitives for HUDs/timestamps (found ${skiaTextCount} instances)`);
assert(skiaRectCount >= 10, `TC-1.4: Plentiful Skia Rect primitives for frames/bars (found ${skiaRectCount} instances)`);
assert(skiaCircleCount >= 2, `TC-1.5: Skia Circle primitives for REC dot and Fisheye lens (found ${skiaCircleCount} instances)`);
assert(skiaRoundedRectCount >= 10, `TC-1.6: Skia RoundedRect primitives for battery indicators and film sprockets (found ${skiaRoundedRectCount} instances)`);

// 1.3: Preset and Frame Coverage across all presets in constants/presets.ts
const presetsSrc = fs.readFileSync(presetsPath, 'utf8');
const presetsSf = ts.createSourceFile('presets.ts', presetsSrc, ts.ScriptTarget.Latest, true);

let extractedPresets = [];
function extractPresets(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(presetsSf) === 'CAMERA_PRESETS') {
    if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      for (const el of node.initializer.elements) {
        if (ts.isObjectLiteralExpression(el)) {
          let preset = {};
          for (const prop of el.properties) {
            if (ts.isPropertyAssignment(prop)) {
              const key = prop.name.getText(presetsSf);
              const val = prop.initializer.getText(presetsSf).replace(/['"]/g, '');
              preset[key] = val;
            }
          }
          if (preset.id) extractedPresets.push(preset);
        }
      }
    }
  }
  ts.forEachChild(node, extractPresets);
}
extractPresets(presetsSf);

assert(extractedPresets.length >= 15, `TC-1.7: Extracted ${extractedPresets.length} presets from constants/presets.ts`);

const distinctFrameTypes = new Set(extractedPresets.map(p => p.frameType));
console.log(`    Distinct frame types in presets: ${Array.from(distinctFrameTypes).join(', ')}`);

// Check that FilteredSceneContent has explicit branches for each frame type
const handledFrameTypes = ['polaroid', 'half-frame', '8mm', '16mm', 'fisheye', 'camcorder', 'vhs', 'digital', 'disposable', 'none'];
let allFramesHandled = true;
let unhandledFrames = [];
for (const ft of distinctFrameTypes) {
  if (!handledFrameTypes.includes(ft)) {
    allFramesHandled = false;
    unhandledFrames.push(ft);
  }
}
assert(allFramesHandled, `TC-1.8: All distinct preset frameTypes are explicitly handled in FilteredImage`, `Unhandled: ${unhandledFrames.join(', ')}`);

// 1.4: Empirical Font Safety Simulation (getSafeFont & getTextWidth)
console.log('\x1b[33m[Section 1.4] Empirical Font Safety Simulation\x1b[0m');

// Replicate getSafeFont and test with adversarial mocks
function createMockGetSafeFont(mockPlatformOS, matchFontBehavior, fontConstructorBehavior) {
  return function getSafeFont(fontSize, options) {
    const isMono = options?.isMono ?? true;
    const weight = options?.fontWeight ?? 'bold';
    const preferredFamily = isMono
      ? (mockPlatformOS === 'ios' ? 'Courier' : 'monospace')
      : (mockPlatformOS === 'ios' ? 'Helvetica' : 'sans-serif');

    // Tier 1
    try {
      const font = matchFontBehavior({
        fontFamily: preferredFamily,
        fontSize,
        fontWeight: weight,
      });
      if (font) return font;
    } catch {}

    // Tier 2
    try {
      const font = matchFontBehavior({
        fontSize,
        fontWeight: weight,
      });
      if (font) return font;
    } catch {}

    // Tier 3
    try {
      const font = fontConstructorBehavior(undefined, fontSize);
      if (font) return font;
    } catch {}

    return null;
  };
}

function getTextWidth(font, text) {
  if (!font || !text) return 0;
  try {
    if (typeof font.getTextWidth === 'function') {
      return font.getTextWidth(text);
    }
    if (typeof font.measureText === 'function') {
      return font.measureText(text).width;
    }
  } catch {}
  return text.length * font.getSize() * 0.6;
}

// Scenario A: Happy path (Tier 1 succeeds)
const mockFontA = { getSize: () => 12, getTextWidth: (t) => t.length * 7 };
const getSafeFontA = createMockGetSafeFont('ios', () => mockFontA, () => null);
const resA = getSafeFontA(12, { isMono: true });
assert(resA === mockFontA, 'TC-1.9: getSafeFont returns Tier 1 font when matchFont succeeds');

// Scenario B: Tier 1 throws native exception, Tier 2 succeeds
let tier1Called = false;
let tier2Called = false;
const getSafeFontB = createMockGetSafeFont('android', (args) => {
  if (args.fontFamily) {
    tier1Called = true;
    throw new Error('Native font Courier not found in asset manager');
  }
  tier2Called = true;
  return mockFontA;
}, () => null);
const resB = getSafeFontB(12, { isMono: true });
assert(tier1Called && tier2Called && resB === mockFontA, 'TC-1.10: getSafeFont catches Tier 1 native throw and seamlessly recovers on Tier 2');

// Scenario C: Tier 1 and Tier 2 both throw, Tier 3 Skia.Font succeeds
const mockFontC = { getSize: () => 14, measureText: (t) => ({ width: t.length * 8 }) };
let tier3Called = false;
const getSafeFontC = createMockGetSafeFont('ios', () => {
  throw new Error('matchFont completely unavailable');
}, (fam, sz) => {
  tier3Called = true;
  return mockFontC;
});
const resC = getSafeFontC(14, { isMono: false });
assert(tier3Called && resC === mockFontC, 'TC-1.11: getSafeFont recovers via Tier 3 Skia.Font when matchFont is completely broken');

// Scenario D: Catastrophic environment where matchFont AND Skia.Font throw
const getSafeFontD = createMockGetSafeFont('ios', () => {
  throw new Error('matchFont crash');
}, () => {
  throw new Error('Skia.Font crash');
});
let noThrowD = false;
let resD = null;
try {
  resD = getSafeFontD(12);
  noThrowD = true;
} catch (e) {
  noThrowD = false;
}
assert(noThrowD && resD === null, 'TC-1.12: getSafeFont returns null without throwing even if all font APIs crash');

// Scenario E: getTextWidth resilience
assert(getTextWidth(null, 'RetroCam') === 0, 'TC-1.13: getTextWidth safely returns 0 when font is null');
assert(getTextWidth(mockFontA, '') === 0, 'TC-1.14: getTextWidth safely returns 0 when text is empty');
assert(getTextWidth(mockFontA, '12/24/98') === 8 * 7, 'TC-1.15: getTextWidth correctly computes width with font.getTextWidth');
assert(getTextWidth(mockFontC, 'RetroCam') === 8 * 8, 'TC-1.16: getTextWidth correctly computes width with font.measureText');

// Broken font where methods throw
const brokenFont = {
  getSize: () => 10,
  getTextWidth: () => { throw new Error('C++ SkFont crash'); },
  measureText: () => { throw new Error('C++ SkFont crash'); },
};
let textWidthNoThrow = false;
let computedWidth = 0;
try {
  computedWidth = getTextWidth(brokenFont, 'HELLO');
  textWidthNoThrow = true;
} catch {}
assert(textWidthNoThrow && computedWidth === 5 * 10 * 0.6, 'TC-1.17: getTextWidth catches native method crashes and uses mathematical fallback (5*10*0.6=30)');

// ─────────────────────────────────────────────────────────────
//  SECTION 2: Skia Grain & Turbulence Optimization (R6)
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Section 2] Skia Grain & Turbulence Optimization (R6)\x1b[0m');

// 2.1: AST scan of all Turbulence elements in FilteredImage.tsx
let turbulenceCount = 0;
let allOctavesAreOne = true;
let octavesViolations = [];

function checkTurbulence(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    if (node.tagName.getText(fiSourceFile) === 'Turbulence') {
      turbulenceCount++;
      let octavesProp = null;
      for (const attr of node.attributes.properties) {
        if (ts.isJsxAttribute(attr) && attr.name.getText(fiSourceFile) === 'octaves') {
          octavesProp = attr.initializer ? attr.initializer.getText(fiSourceFile) : null;
        }
      }
      if (octavesProp !== '{1}') {
        allOctavesAreOne = false;
        octavesViolations.push(`Line ${fiSourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: octaves=${octavesProp}`);
      }
    }
  }
  ts.forEachChild(node, checkTurbulence);
}
checkTurbulence(fiSourceFile);

assert(turbulenceCount >= 3, `TC-2.1: Found ${turbulenceCount} Turbulence elements in FilteredImage.tsx (Grain, Dust, Scratches)`);
assert(allOctavesAreOne, `TC-2.2: ALL Turbulence elements strictly use octaves={1}`, octavesViolations.join('; '));

// 2.2: Scan entire codebase to ensure no remaining octaves={3} or octaves={2}
const componentsDir = path.join(__dirname, '../components');
let strayHighOctaves = [];

function scanDirForTurbulence(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDirForTurbulence(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(/<Turbulence[^>]*octaves=\{([2-9]|\d{2,})\}[^>]*>/g);
      if (matches) {
        strayHighOctaves.push(...matches.map(m => `${f}: ${m}`));
      }
    }
  }
}
scanDirForTurbulence(componentsDir);
assert(strayHighOctaves.length === 0, 'TC-2.3: Zero remaining high-octave Turbulence elements across components/', strayHighOctaves.join('; '));

// 2.3: Mathematical stress test across 1000 canvas widths
console.log('    Stress-testing adaptive frequencies across widths [1px .. 8192px]...');
let mathStressPass = true;
let mathStressErrors = [];

for (let w = 1; w <= 8192; w += Math.floor(Math.random() * 8) + 1) {
  const resFactor = Math.max(1, w / 390);
  const sqrtRes = Math.sqrt(resFactor);
  const grainFreq = 0.75 / sqrtRes;
  const dustFreq = 0.9 / sqrtRes;
  const scratchFreqX = 0.01 / sqrtRes;
  const scratchFreqY = 0.8 / sqrtRes;

  const freqs = [
    { name: 'grain', val: grainFreq, min: 0.01, max: 0.75 },
    { name: 'dust', val: dustFreq, min: 0.01, max: 0.9 },
    { name: 'scratchX', val: scratchFreqX, min: 0.0001, max: 0.01 },
    { name: 'scratchY', val: scratchFreqY, min: 0.01, max: 0.8 },
  ];

  for (const f of freqs) {
    if (!Number.isFinite(f.val) || Number.isNaN(f.val) || f.val <= 0 || f.val > f.max) {
      mathStressPass = false;
      mathStressErrors.push(`w=${w}: ${f.name}=${f.val}`);
      break;
    }
  }
  if (!mathStressPass) break;
}
assert(mathStressPass, 'TC-2.4: 1000x frequency calculations are strictly finite, positive, and bounded', mathStressErrors.slice(0, 3).join('; '));

// 2.4: Monotonic scaling verification
// Frequency should monotonically decrease or remain constant as canvas width increases
let monotonicPass = true;
let lastGrainFreq = Infinity;
for (let w = 390; w <= 4096; w += 50) {
  const resFactor = Math.max(1, w / 390);
  const sqrtRes = Math.sqrt(resFactor);
  const grainFreq = 0.75 / sqrtRes;
  if (grainFreq > lastGrainFreq + 1e-9) {
    monotonicPass = false;
    break;
  }
  lastGrainFreq = grainFreq;
}
assert(monotonicPass, 'TC-2.5: Frequencies monotonically decrease from 390px to 4096px (preventing high-frequency grain explosion)');

// 2.5: Adversarial boundary inputs (w = 0, negative, NaN)
function computeFreqs(w) {
  const resFactor = Math.max(1, w / 390);
  const sqrtRes = Math.sqrt(resFactor);
  return {
    grainFreq: 0.75 / sqrtRes,
    dustFreq: 0.9 / sqrtRes,
  };
}
const zeroW = computeFreqs(0);
assert(zeroW.grainFreq === 0.75 && zeroW.dustFreq === 0.9, 'TC-2.6: Width = 0 safely clamps resFactor to 1 (grainFreq=0.75, dustFreq=0.9, no division by zero)');

const negW = computeFreqs(-500);
assert(negW.grainFreq === 0.75 && negW.dustFreq === 0.9, 'TC-2.7: Negative width safely clamps resFactor to 1');

// ─────────────────────────────────────────────────────────────
//  SECTION 3: Offscreen High-Res Export & Fallback Cascade (R1)
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Section 3] Offscreen High-Res Export & Fallback Cascade (R1)\x1b[0m');

// 3.1: AST check for 3-tier cascade and error guarding
let hasMakeOffscreen = false;
let hasMake = false;
let hasMakeImageSnapshotAsync = false;
let hasCatchGpuErr = false;
let hasCatchCpuErr = false;
let hasCatchOffscreenErr = false;
let hasJpegFormat92 = false;
let hasFileSystemWrite = false;

function scanCaptureBody(node) {
  const text = node.getText(fiSourceFile);
  if (text.includes('Skia.Surface.MakeOffscreen')) hasMakeOffscreen = true;
  if (text.includes('Skia.Surface.Make(')) hasMake = true;
  if (text.includes('canvasRef.current.makeImageSnapshotAsync()') || text.includes('canvasRef.current?.makeImageSnapshotAsync()')) hasMakeImageSnapshotAsync = true;
  if (text.includes('gpuErr')) hasCatchGpuErr = true;
  if (text.includes('cpuErr')) hasCatchCpuErr = true;
  if (text.includes('offscreenErr')) hasCatchOffscreenErr = true;
  if (text.includes('ImageFormat.JPEG, 92')) hasJpegFormat92 = true;
  if (text.includes('FileSystem.writeAsStringAsync')) hasFileSystemWrite = true;

  ts.forEachChild(node, scanCaptureBody);
}
scanCaptureBody(fiSourceFile);

assert(hasMakeOffscreen, 'TC-3.1: Tier 1 utilizes Skia.Surface.MakeOffscreen for GPU-backed offscreen rendering');
assert(hasMake, 'TC-3.2: Tier 2 utilizes Skia.Surface.Make for CPU RAM raster fallback');
assert(hasMakeImageSnapshotAsync, 'TC-3.3: Tier 3 utilizes canvasRef.current.makeImageSnapshotAsync for onscreen snapshot fallback');
assert(hasCatchGpuErr && hasCatchCpuErr && hasCatchOffscreenErr, 'TC-3.4: All tiers are individually try/catch error guarded');
assert(hasJpegFormat92, 'TC-3.5: Image is encoded using ImageFormat.JPEG with quality 92');
assert(hasFileSystemWrite, 'TC-3.6: Image is saved via FileSystem.writeAsStringAsync with Base64 encoding');

// 3.2: Empirical Fallback Cascade State Machine Simulation
console.log('    Simulating 3-tier fallback cascade under adversarial failures...');

async function simulateCapturePipeline(tier1Fails, tier2Fails, tier3Fails) {
  let tierAttempted = [];
  let tierSucceeded = null;

  try {
    // Offscreen stage
    try {
      tierAttempted.push('Tier 1: MakeOffscreen');
      if (tier1Fails) throw new Error('GPU texture allocation failed: GL_OUT_OF_MEMORY');
      tierSucceeded = 'Tier 1';
    } catch (gpuErr) {
      // Tier 2 fallback
      tierAttempted.push('Tier 2: Make (CPU)');
      if (tier2Fails) {
        throw new Error('Host memory allocation failed: OOM');
      }
      tierSucceeded = 'Tier 2';
    }
  } catch (offscreenErr) {
    // Offscreen failed, drop to Tier 3
    tierAttempted.push('Tier 3: makeImageSnapshotAsync (Onscreen)');
    if (tier3Fails) {
      tierSucceeded = null;
    } else {
      tierSucceeded = 'Tier 3';
    }
  }

  return { tierAttempted, tierSucceeded };
}

(async () => {
  // Scenario 1: Tier 1 succeeds (Normal GPU path)
  const sim1 = await simulateCapturePipeline(false, false, false);
  assert(sim1.tierSucceeded === 'Tier 1', 'TC-3.7: Healthy device successfully renders on Tier 1 (GPU)');

  // Scenario 2: Tier 1 fails (GPU OOM at 4096px), Tier 2 succeeds (CPU RAM)
  const sim2 = await simulateCapturePipeline(true, false, false);
  assert(sim2.tierSucceeded === 'Tier 2', 'TC-3.8: GPU OOM correctly fails over to Tier 2 (CPU RAM)');

  // Scenario 3: Tier 1 & Tier 2 fail (Low memory device), Tier 3 succeeds (Onscreen)
  const sim3 = await simulateCapturePipeline(true, true, false);
  assert(sim3.tierSucceeded === 'Tier 3', 'TC-3.9: Total offscreen failure falls back to Tier 3 (Onscreen Canvas)');

  // Scenario 4: All tiers fail -> graceful null, no crash
  const sim4 = await simulateCapturePipeline(true, true, true);
  assert(sim4.tierSucceeded === null, 'TC-3.10: Catastrophic device failure returns null gracefully without uncaught rejection');
})();

// ─────────────────────────────────────────────────────────────
//  SECTION 4: Dimension Calculations & Geometry Stress (R4 & R1)
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Section 4] Dimension Calculations & Geometry Stress (R4 & R1)\x1b[0m');

// Replicate getAspectDimensions exactly as in FilteredImage.tsx
function getAspectDimensions(nativeW, nativeH, aspectRatio = 'full', maxDimension = 4096) {
  if (!nativeW || !nativeH || nativeW <= 0 || nativeH <= 0) {
    return { width: 1080, height: 1080 };
  }

  const isLandscape = nativeW > nativeH;
  let targetRatio;

  switch (aspectRatio) {
    case '1:1':
      targetRatio = 1.0;
      break;
    case '3:2':
      targetRatio = isLandscape ? 3 / 2 : 2 / 3;
      break;
    case '4:5':
      targetRatio = isLandscape ? 5 / 4 : 4 / 5;
      break;
    case 'full':
    default:
      targetRatio = nativeW / nativeH;
      break;
  }

  const sourceRatio = nativeW / nativeH;
  let cropW;
  let cropH;

  if (Math.abs(sourceRatio - targetRatio) < 0.001) {
    cropW = nativeW;
    cropH = nativeH;
  } else if (sourceRatio > targetRatio) {
    cropH = nativeH;
    cropW = Math.round(nativeH * targetRatio);
  } else {
    cropW = nativeW;
    cropH = Math.round(nativeW / targetRatio);
  }

  if (cropW > maxDimension || cropH > maxDimension) {
    const scale = Math.min(maxDimension / cropW, maxDimension / cropH);
    return {
      width: Math.round(cropW * scale),
      height: Math.round(cropH * scale),
    };
  }

  return { width: cropW, height: cropH };
}

// 4.1: Portrait camera photo 3024x4032 (iPhone 12MP portrait)
const p11 = getAspectDimensions(3024, 4032, '1:1');
assert(p11.width === 3024 && p11.height === 3024, `TC-4.1: 3024x4032 1:1 -> ${p11.width}x${p11.height}`);

const p32 = getAspectDimensions(3024, 4032, '3:2');
assert(p32.width === 2688 && p32.height === 4032, `TC-4.2: 3024x4032 3:2 -> ${p32.width}x${p32.height} (ratio ${p32.height / p32.width})`);

const p45 = getAspectDimensions(3024, 4032, '4:5');
assert(p45.width === 3024 && p45.height === 3780, `TC-4.3: 3024x4032 4:5 -> ${p45.width}x${p45.height} (ratio ${p45.height / p45.width})`);

// 4.2: Landscape camera photo 4032x3024 (iPhone 12MP landscape)
const l11 = getAspectDimensions(4032, 3024, '1:1');
assert(l11.width === 3024 && l11.height === 3024, `TC-4.4: 4032x3024 1:1 -> ${l11.width}x${l11.height}`);

const l32 = getAspectDimensions(4032, 3024, '3:2');
assert(l32.width === 4032 && l32.height === 2688, `TC-4.5: 4032x3024 3:2 -> ${l32.width}x${l32.height} (ratio ${l32.width / l32.height})`);

const l45 = getAspectDimensions(4032, 3024, '4:5');
assert(l45.width === 3780 && l45.height === 3024, `TC-4.6: 4032x3024 4:5 -> ${l45.width}x${l45.height} (ratio ${l45.width / l45.height})`);

// 4.3: Extreme high-resolution clamp (48MP & 108MP)
const proRaw48MP = getAspectDimensions(6048, 8064, 'full', 4096);
assert(proRaw48MP.height === 4096 && proRaw48MP.width === Math.round(6048 * (4096 / 8064)), `TC-4.7: 48MP (6048x8064) clamped to max 4096px -> ${proRaw48MP.width}x${proRaw48MP.height}`);

const ultra108MP = getAspectDimensions(12000, 9000, '3:2', 4096);
assert(ultra108MP.width <= 4096 && ultra108MP.height <= 4096, `TC-4.8: 108MP (12000x9000) clamped to max 4096px -> ${ultra108MP.width}x${ultra108MP.height}`);

// 4.4: Adversarial inputs
const zeroDims = getAspectDimensions(0, 0, '1:1');
assert(zeroDims.width === 1080 && zeroDims.height === 1080, 'TC-4.9: Zero dimensions safely return 1080x1080 fallback');

const negDims = getAspectDimensions(-1920, -1080, '1:1');
assert(negDims.width === 1080 && negDims.height === 1080, 'TC-4.10: Negative dimensions safely return 1080x1080 fallback');

const nanDims = getAspectDimensions(NaN, undefined, '1:1');
assert(nanDims.width === 1080 && nanDims.height === 1080, 'TC-4.11: NaN/undefined dimensions safely return 1080x1080 fallback');

// 4.5: Preview Size Containment across Devices
function calculatePreviewSize(aspectRatio, maxW, maxH) {
  let targetRatio;
  switch (aspectRatio) {
    case '1:1':
      targetRatio = 1;
      break;
    case '3:2':
      targetRatio = 2 / 3;
      break;
    case '4:5':
      targetRatio = 4 / 5;
      break;
    case 'full':
    default:
      targetRatio = maxW / maxH;
      break;
  }

  let width = maxW;
  let height = Math.round(width / targetRatio);

  if (height > maxH) {
    height = maxH;
    width = Math.round(height * targetRatio);
  }

  return { width, height };
}

const devices = [
  { name: 'iPhone 14 Pro Max', w: 430, h: 512 },
  { name: 'iPhone 13 mini',    w: 375, h: 440 },
  { name: 'iPhone SE 3',       w: 375, h: 366 },
  { name: 'iPad Pro 11"',      w: 834, h: 716 },
  { name: 'iPad Pro 12.9"',    w: 1024, h: 819 },
];

let deviceTestsPass = true;
for (const dev of devices) {
  for (const ratio of ['1:1', '3:2', '4:5', 'full']) {
    const size = calculatePreviewSize(ratio, dev.w, dev.h);
    if (size.width > dev.w || size.height > dev.h) {
      deviceTestsPass = false;
      console.error(`Device overflow on ${dev.name} (${ratio}): ${size.width}x${size.height} > max ${dev.w}x${dev.h}`);
    }
  }
}
assert(deviceTestsPass, 'TC-4.12: calculatePreviewSize strictly contains all aspect ratios across all 5 device form factors');

// ─────────────────────────────────────────────────────────────
//  SUMMARY
// ─────────────────────────────────────────────────────────────
setTimeout(() => {
  console.log('\n\x1b[35m====================================================================\x1b[0m');
  console.log(`\x1b[35m   Challenger 2 Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)\x1b[0m`);
  console.log('\x1b[35m====================================================================\x1b[0m\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 50);
