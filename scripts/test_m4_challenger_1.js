#!/usr/bin/env node

/**
 * Challenger 1 Adversarial Stress Test Suite for Milestone 4:
 * Mathematical Algorithms and Dimension Calculations
 * (getAspectDimensions and calculatePreviewSize)
 *
 * Requirements:
 * - Stress-test getAspectDimensions across portrait, landscape, square, extreme, tiny, and edge cases.
 * - Stress-test calculatePreviewSize across real-world device viewports and grid dimensions.
 * - Enforce 100% containment bounds and aspect ratio preservation.
 * - Execute at least 50-100 empirical stress cases.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let totalCases = 0;
let passedCases = 0;
let failedCases = 0;
const failureDetails = [];

function check(condition, desc, details = '') {
  totalCases++;
  if (condition) {
    passedCases++;
    if (totalCases <= 10 || totalCases % 25 === 0) {
      console.log(`  \x1b[32m✔ [CASE ${totalCases}]\x1b[0m ${desc}`);
    }
  } else {
    failedCases++;
    const errMsg = `[CASE ${totalCases}] FAIL: ${desc} ${details ? '-> ' + details : ''}`;
    console.error(`  \x1b[31m✖ ${errMsg}\x1b[0m`);
    failureDetails.push(errMsg);
  }
}

console.log('\n\x1b[35m====================================================================\x1b[0m');
console.log('\x1b[35m   Milestone 4 - Challenger 1: Adversarial Mathematical Stress Harness \x1b[0m');
console.log('\x1b[35m====================================================================\x1b[0m\n');

// ─────────────────────────────────────────────────────────────
//  Load production implementations dynamically via AST
// ─────────────────────────────────────────────────────────────

function compileFunction(code, funcName) {
  const transpiled = ts.transpile(code, { module: ts.ModuleKind.CommonJS });
  const fn = new Function('exports', transpiled + `; return exports.${funcName} || ${funcName};`);
  const exportsObj = {};
  return fn(exportsObj);
}

const filteredImageSrc = fs.readFileSync(path.join(__dirname, '../components/FilteredImage.tsx'), 'utf8');
const fiSf = ts.createSourceFile('FilteredImage.tsx', filteredImageSrc, ts.ScriptTarget.Latest, true);
let getAspectDimensionsCode = '';
fiSf.forEachChild(n => {
  if (ts.isFunctionDeclaration(n) && n.name && n.name.text === 'getAspectDimensions') {
    getAspectDimensionsCode = n.getText(fiSf);
  }
});
if (!getAspectDimensionsCode) {
  throw new Error('Failed to extract getAspectDimensions from components/FilteredImage.tsx');
}
const getAspectDimensions = compileFunction(getAspectDimensionsCode, 'getAspectDimensions');

const previewSrc = fs.readFileSync(path.join(__dirname, '../app/preview.tsx'), 'utf8');
const pSf = ts.createSourceFile('preview.tsx', previewSrc, ts.ScriptTarget.Latest, true);
let calculatePreviewSizeCode = '';
pSf.forEachChild(n => {
  if (ts.isFunctionDeclaration(n) && n.name && n.name.text === 'calculatePreviewSize') {
    calculatePreviewSizeCode = n.getText(pSf);
  }
});
if (!calculatePreviewSizeCode) {
  throw new Error('Failed to extract calculatePreviewSize from app/preview.tsx');
}
const calculatePreviewSize = compileFunction(calculatePreviewSizeCode, 'calculatePreviewSize');

console.log('\x1b[34m[Section 1] `getAspectDimensions` Standard Orientations & Aspect Ratios\x1b[0m');

const standardCameras = [
  // Portrait photos (nativeW < nativeH)
  { label: 'iPhone 12MP Portrait (3024x4032)', w: 3024, h: 4032, type: 'portrait' },
  { label: 'iPhone 48MP Portrait (6048x8064)', w: 6048, h: 8064, type: 'portrait' },
  { label: 'Standard 4:3 Portrait (1200x1600)', w: 1200, h: 1600, type: 'portrait' },
  { label: 'Full HD Portrait (1080x1920)', w: 1080, h: 1920, type: 'portrait' },
  { label: '4K Portrait (2160x3840)', w: 2160, h: 3840, type: 'portrait' },

  // Landscape photos (nativeW > nativeH)
  { label: 'iPhone 12MP Landscape (4032x3024)', w: 4032, h: 3024, type: 'landscape' },
  { label: 'iPhone 48MP Landscape (8064x6048)', w: 8064, h: 6048, type: 'landscape' },
  { label: 'Standard 4:3 Landscape (1600x1200)', w: 1600, h: 1200, type: 'landscape' },
  { label: 'Full HD Landscape (1920x1080)', w: 1920, h: 1080, type: 'landscape' },
  { label: '4K Landscape (3840x2160)', w: 3840, h: 2160, type: 'landscape' },

  // Square photos (nativeW === nativeH)
  { label: 'Square 12MP (3024x3024)', w: 3024, h: 3024, type: 'square' },
  { label: 'Square 4K (4000x4000)', w: 4000, h: 4000, type: 'square' },
  { label: 'Square Medium (1080x1080)', w: 1080, h: 1080, type: 'square' },
  { label: 'Square Small (500x500)', w: 500, h: 500, type: 'square' },
];

const aspectRatios = ['1:1', '3:2', '4:5', 'full'];

for (const cam of standardCameras) {
  for (const ar of aspectRatios) {
    const res = getAspectDimensions(cam.w, cam.h, ar, 4096);

    // 1. Clamping check: <= 4096
    const clampOk = res.width <= 4096 && res.height <= 4096;
    check(clampOk, `${cam.label} [${ar}] clamp <= 4096: got ${res.width}x${res.height}`);

    // 2. Positivity
    check(res.width > 0 && res.height > 0, `${cam.label} [${ar}] positive dimensions: got ${res.width}x${res.height}`);

    // 3. Aspect Ratio verification
    const observedRatio = res.width / res.height;
    if (ar === '1:1') {
      const isSquare = Math.abs(res.width - res.height) <= 1;
      check(isSquare, `${cam.label} [1:1] is square: ${res.width}x${res.height}`);
    } else if (ar === '3:2') {
      const target = cam.type === 'landscape' ? 3 / 2 : 2 / 3;
      const match = Math.abs(observedRatio - target) < 0.02;
      check(match, `${cam.label} [3:2] ratio target ${target.toFixed(3)}: got ${observedRatio.toFixed(3)}`);
    } else if (ar === '4:5') {
      const target = cam.type === 'landscape' ? 5 / 4 : 4 / 5;
      const match = Math.abs(observedRatio - target) < 0.02;
      check(match, `${cam.label} [4:5] ratio target ${target.toFixed(3)}: got ${observedRatio.toFixed(3)}`);
    } else if (ar === 'full') {
      const target = cam.w / cam.h;
      const match = Math.abs(observedRatio - target) < 0.02;
      check(match, `${cam.label} [full] ratio target ${target.toFixed(3)}: got ${observedRatio.toFixed(3)}`);
    }
  }
}

console.log('\n\x1b[34m[Section 2] `getAspectDimensions` Extreme Dimensions & Clamping Stress\x1b[0m');

const extremeDimensions = [
  { label: '8K UHD (7680x4320)', w: 7680, h: 4320 },
  { label: '8K DCI (8192x4320)', w: 8192, h: 4320 },
  { label: '12K Extreme (12288x6480)', w: 12288, h: 6480 },
  { label: 'Ultra-Tall (1000x10000)', w: 1000, h: 10000 },
  { label: 'Ultra-Wide (10000x1000)', w: 10000, h: 1000 },
  { label: 'Mega-Panorama (30000x2000)', w: 30000, h: 2000 },
  { label: 'Extreme Tall Strip (500x25000)', w: 500, h: 25000 },
  { label: 'Exact Boundary (4096x4096)', w: 4096, h: 4096 },
  { label: 'Boundary + 1 (4097x4097)', w: 4097, h: 4097 },
  { label: 'Boundary - 1 (4095x4095)', w: 4095, h: 4095 },
  { label: 'Large Prime (4099x4099)', w: 4099, h: 4099 },
  { label: 'Primes (4093x4091)', w: 4093, h: 4091 },
  { label: 'Tiny 1x1', w: 1, h: 1 },
  { label: 'Tiny 2x1', w: 2, h: 1 },
  { label: 'Tiny 1x2', w: 1, h: 2 },
  { label: 'Tiny 10x10', w: 10, h: 10 },
];

for (const ext of extremeDimensions) {
  for (const ar of ['1:1', '3:2', '4:5', 'full']) {
    const res = getAspectDimensions(ext.w, ext.h, ar, 4096);
    const clampPass = res.width <= 4096 && res.height <= 4096;
    check(clampPass, `Extreme ${ext.label} [${ar}] clamped to <= 4096: got ${res.width}x${res.height}`);
    check(res.width > 0 && res.height > 0, `Extreme ${ext.label} [${ar}] positive dimensions: ${res.width}x${res.height}`);
  }
}

console.log('\n\x1b[34m[Section 3] `getAspectDimensions` Custom maxDimension Clamping\x1b[0m');

const customBounds = [2048, 1920, 1080, 512, 100];
for (const bound of customBounds) {
  const resPortrait = getAspectDimensions(6048, 8064, 'full', bound);
  check(
    resPortrait.width <= bound && resPortrait.height <= bound,
    `Custom bound ${bound} portrait clamp: got ${resPortrait.width}x${resPortrait.height}`
  );
  check(
    Math.max(resPortrait.width, resPortrait.height) === bound,
    `Custom bound ${bound} portrait scales to exactly bound: max is ${Math.max(resPortrait.width, resPortrait.height)}`
  );

  const resLandscape = getAspectDimensions(8064, 6048, 'full', bound);
  check(
    resLandscape.width <= bound && resLandscape.height <= bound,
    `Custom bound ${bound} landscape clamp: got ${resLandscape.width}x${resLandscape.height}`
  );
  check(
    Math.max(resLandscape.width, resLandscape.height) === bound,
    `Custom bound ${bound} landscape scales to exactly bound: max is ${Math.max(resLandscape.width, resLandscape.height)}`
  );
}

console.log('\n\x1b[34m[Section 4] `getAspectDimensions` Edge Cases & Degenerate Inputs\x1b[0m');

const edgeCases = [
  { desc: 'Zero width and height (0, 0)', w: 0, h: 0, ar: '1:1' },
  { desc: 'Zero width (0, 4032)', w: 0, h: 4032, ar: '3:2' },
  { desc: 'Zero height (3024, 0)', w: 3024, h: 0, ar: '4:5' },
  { desc: 'Negative width (-3024, 4032)', w: -3024, h: 4032, ar: 'full' },
  { desc: 'Negative height (3024, -4032)', w: 3024, h: -4032, ar: '1:1' },
  { desc: 'Both negative (-3024, -4032)', w: -3024, h: -4032, ar: '3:2' },
  { desc: 'NaN width (NaN, 4032)', w: NaN, h: 4032, ar: '1:1' },
  { desc: 'NaN height (3024, NaN)', w: 3024, h: NaN, ar: 'full' },
  { desc: 'Undefined dimensions', w: undefined, h: undefined, ar: '1:1' },
  { desc: 'Null dimensions', w: null, h: null, ar: '1:1' },
  { desc: 'Invalid aspect ratio string "16:9"', w: 3024, h: 4032, ar: '16:9' },
  { desc: 'Empty aspect ratio string ""', w: 3024, h: 4032, ar: '' },
  { desc: 'Null aspect ratio', w: 3024, h: 4032, ar: null },
];

for (const ec of edgeCases) {
  let ok = false;
  try {
    const res = getAspectDimensions(ec.w, ec.h, ec.ar, 4096);
    ok = !isNaN(res.width) && !isNaN(res.height) && res.width > 0 && res.height > 0 && res.width <= 4096 && res.height <= 4096;
    check(ok, `Edge case ${ec.desc} handled safely without crashing: got ${res.width}x${res.height}`);
  } catch (err) {
    check(false, `Edge case ${ec.desc} threw exception: ${err.message}`);
  }
}

console.log('\n\x1b[34m[Section 5] `calculatePreviewSize` Real-World Device Viewports\x1b[0m');

const realDeviceScenarios = [
  { device: 'iPhone SE (375x667)', maxW: 343, maxH: 366 },
  { device: 'iPhone 13 mini (375x812)', maxW: 343, maxH: 446 },
  { device: 'iPhone 14 / 15 / 16 (390x844)', maxW: 358, maxH: 464 },
  { device: 'iPhone 14 Pro Max / 16 Pro Max (430x932)', maxW: 398, maxH: 512 },
  { device: 'Google Pixel 7 (412x915)', maxW: 380, maxH: 503 },
  { device: 'Samsung Galaxy S23 (360x780)', maxW: 328, maxH: 429 },
  { device: 'Samsung Galaxy S23 Ultra (384x824)', maxW: 352, maxH: 453 },
  { device: 'iPad Mini (744x1133 tablet)', maxW: 712, maxH: 679 },
  { device: 'iPad Air 11" (820x1180 tablet)', maxW: 788, maxH: 708 },
  { device: 'iPad Pro 12.9" (1024x1366 tablet)', maxW: 992, maxH: 819 },
  { device: 'Tablet Landscape (1180x820 tablet)', maxW: 1148, maxH: 492 },
];

for (const d of realDeviceScenarios) {
  for (const ar of ['1:1', '3:2', '4:5', 'full']) {
    const s = calculatePreviewSize(ar, d.maxW, d.maxH);

    // 1. Strict containment
    const contained = s.width <= d.maxW && s.height <= d.maxH;
    check(
      contained,
      `${d.device} [${ar}] contained: ${s.width}x${s.height} <= ${d.maxW}x${d.maxH}`,
      `width=${s.width} (max ${d.maxW}), height=${s.height} (max ${d.maxH})`
    );

    // 2. Positive non-zero
    check(s.width > 0 && s.height > 0, `${d.device} [${ar}] non-zero positive: ${s.width}x${s.height}`);

    // 3. Aspect Ratio Match
    if (ar === '1:1') {
      const isSquare = Math.abs(s.width - s.height) <= 1;
      check(isSquare, `${d.device} [1:1] is square: ${s.width}x${s.height}`);
    } else if (ar === '3:2') {
      // Portrait 35mm -> target ratio 2 / 3
      const ratio = s.width / s.height;
      const match = Math.abs(ratio - 2 / 3) < 0.02;
      check(match, `${d.device} [3:2] ratio target ${(2/3).toFixed(3)}: got ${ratio.toFixed(3)}`);
    } else if (ar === '4:5') {
      // Portrait 4:5 -> target ratio 4 / 5
      const ratio = s.width / s.height;
      const match = Math.abs(ratio - 4 / 5) < 0.02;
      check(match, `${d.device} [4:5] ratio target 0.800: got ${ratio.toFixed(3)}`);
    } else if (ar === 'full') {
      check(s.width === d.maxW && s.height === d.maxH, `${d.device} [full] fills container: ${s.width}x${s.height} === ${d.maxW}x${d.maxH}`);
    }
  }
}

console.log('\n\x1b[34m[Section 6] `calculatePreviewSize` Invariant Grid Search (Exhaustive Containment)\x1b[0m');

let gridContainmentViolations = 0;
let gridCalculations = 0;

for (let w = 150; w <= 1000; w += 47) {
  for (let h = 150; h <= 1000; h += 53) {
    for (const ar of ['1:1', '3:2', '4:5', 'full']) {
      gridCalculations++;
      const s = calculatePreviewSize(ar, w, h);
      if (s.width > w || s.height > h || s.width <= 0 || s.height <= 0) {
        gridContainmentViolations++;
      }
    }
  }
}

check(
  gridContainmentViolations === 0,
  `Exhaustive grid search across ${gridCalculations} combinations had ZERO containment violations (violations: ${gridContainmentViolations})`
);

console.log('\n\x1b[34m[Section 7] `calculatePreviewSize` Degenerate & Extreme Boundaries\x1b[0m');

const previewEdgeCases = [
  { desc: 'Equal tiny dimensions 1x1', ar: '1:1', maxW: 1, maxH: 1 },
  { desc: 'Narrow strip 10x1000', ar: '1:1', maxW: 10, maxH: 1000 },
  { desc: 'Wide strip 1000x10', ar: '1:1', maxW: 1000, maxH: 10 },
  { desc: 'Narrow strip 3:2 (10x1000)', ar: '3:2', maxW: 10, maxH: 1000 },
  { desc: 'Wide strip 3:2 (1000x10)', ar: '3:2', maxW: 1000, maxH: 10 },
  { desc: 'Invalid aspect ratio', ar: 'unknown_ratio', maxW: 390, maxH: 464 },
];

for (const ec of previewEdgeCases) {
  const s = calculatePreviewSize(ec.ar, ec.maxW, ec.maxH);
  const ok = s.width <= ec.maxW && s.height <= ec.maxH && s.width > 0 && s.height > 0;
  check(ok, `Preview edge case: ${ec.desc} -> ${s.width}x${s.height} <= ${ec.maxW}x${ec.maxH}`);
}

// ─────────────────────────────────────────────────────────────
//  Summary & Verdict
// ─────────────────────────────────────────────────────────────

console.log('\n\x1b[35m====================================================================\x1b[0m');
console.log(`\x1b[35m   Challenger 1 Stress Test Results: ${passedCases}/${totalCases} Passed\x1b[0m`);
if (failedCases > 0) {
  console.log(`\x1b[31m   FAILURES: ${failedCases} cases failed\x1b[0m`);
  failureDetails.forEach(f => console.error('   ' + f));
} else {
  console.log('\x1b[32m   ALL ADVERSARIAL STRESS CASES PASSED (0 FAILURES)\x1b[0m');
}
console.log('\x1b[35m====================================================================\x1b[0m\n');

process.exit(failedCases > 0 ? 1 : 0);
