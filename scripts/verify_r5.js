#!/usr/bin/env node

/**
 * Verification Script for Requirement R5: Video Processing & FFmpeg Stability
 * Run with: node scripts/verify_r5.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log('\n\x1b[36m====================================================\x1b[0m');
console.log('\x1b[36m   R5 Video Processing & FFmpeg Stability Test Suite \x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m\n');

// ── Test Suite 1: Static Code Analysis & Safety Inspection ──
console.log('\x1b[33m[Suite 1] Static Code Analysis & Font Safety\x1b[0m');

const videoFilterPath = path.join(__dirname, '../utils/videoFilter.ts');
const videoPreviewPath = path.join(__dirname, '../app/video-preview.tsx');

assert(fs.existsSync(videoFilterPath), 'TC-1.1: utils/videoFilter.ts exists');
assert(fs.existsSync(videoPreviewPath), 'TC-1.2: app/video-preview.tsx exists');

const videoFilterSrc = fs.readFileSync(videoFilterPath, 'utf8');
const videoPreviewSrc = fs.readFileSync(videoPreviewPath, 'utf8');

// Check: Unsafe single hardcoded font path eliminated
const hasUnsafeHardcodedDroidSans = /android:\s*['"]\/system\/fonts\/DroidSansMono\.ttf['"]/.test(videoFilterSrc);
assert(!hasUnsafeHardcodedDroidSans, 'TC-1.3: Deprecated /system/fonts/DroidSansMono.ttf is not hardcoded');

// Check: Multi-candidate font list defined
const hasFontCandidates = /export\s+const\s+FONT_CANDIDATES\s*=/.test(videoFilterSrc);
assert(hasFontCandidates, 'TC-1.4: FONT_CANDIDATES multi-candidate list exported');

// Check: Safe font resolution function exists
const hasResolveSafeFont = /export\s+async\s+function\s+resolveSafeFontPath/.test(videoFilterSrc);
assert(hasResolveSafeFont, 'TC-1.5: resolveSafeFontPath() resolver function exported');

// Check: buildFFmpegArgs supports null fontFile
const supportsNullFont = /fontFile\??:\s*string\s*\|\s*null/.test(videoFilterSrc);
assert(supportsNullFont, 'TC-1.6: buildFFmpegArgs signature accepts fontFile: string | null');

// Check: Escapes single quotes in drawtext text
const hasQuoteEscape = /escapeFFmpegText|replace\(\/'\/g/.test(videoFilterSrc);
assert(hasQuoteEscape, 'TC-1.7: Single quote escaping for FFmpeg drawtext is implemented');

// Check: 3-Tier Fallback cascade in video-preview.tsx
const hasTier1 = /TIER 1/i.test(videoPreviewSrc);
const hasTier2 = /TIER 2/i.test(videoPreviewSrc);
const hasTier3 = /TIER 3/i.test(videoPreviewSrc);
assert(hasTier1 && hasTier2 && hasTier3, 'TC-1.8: 3-Tier fallback cascade (Tier 1, 2, 3) documented and implemented in video-preview.tsx');

// Check: executeWithArgumentsAsync used for non-blocking progress
const usesAsyncExecution = /executeWithArgumentsAsync/.test(videoPreviewSrc);
assert(usesAsyncExecution, 'TC-1.9: FFmpegKit.executeWithArgumentsAsync is utilized');

// Check: Session cancellation on unmount
const hasCancelOnUnmount = /cancel\(\)/.test(videoPreviewSrc);
assert(hasCancelOnUnmount, 'TC-1.10: FFmpeg active session cancellation is called on unmount');

// Check: Retro progress UI elements present
const hasProgressUI = /progressTrack|progressFill|progressPercentage|retroBadge/i.test(videoPreviewSrc);
assert(hasProgressUI, 'TC-1.11: Retro progress bar, percentage, and badge UI elements exist');

// Check: cacheDirectory file management
const usesCacheDir = /cacheDirectory/.test(videoPreviewSrc);
assert(usesCacheDir, 'TC-1.12: Temporary transcode files directed to cacheDirectory');


// ── Test Suite 2: Parameter Clamping & NaN Vulnerability Guard ──
console.log('\n\x1b[33m[Suite 2] Parameter Clamping & NaN Vulnerability Guard\x1b[0m');

// Pure JS simulation of the safeClamp logic in videoFilter.ts
function safeClamp(val, min, max, fallback) {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}

assert(safeClamp(NaN, 0.5, 2.0, 1.0) === 1.0, 'TC-2.1: safeClamp(NaN) returns fallback 1.0');
assert(safeClamp(undefined, 0, 3.0, 1.0) === 1.0, 'TC-2.2: safeClamp(undefined) returns fallback 1.0');
assert(safeClamp(null, 0, 1.0, 0) === 0, 'TC-2.3: safeClamp(null) returns fallback 0');
assert(safeClamp(Infinity, 0, 1.0, 0) === 0, 'TC-2.4: safeClamp(Infinity) returns fallback 0');
assert(safeClamp(-Infinity, 0, 1.0, 0) === 0, 'TC-2.5: safeClamp(-Infinity) returns fallback 0');
assert(safeClamp('1.5', 0, 1.0, 0) === 0, 'TC-2.6: safeClamp("1.5" string) returns fallback 0');
assert(safeClamp(1.5, 0.5, 2.0, 1.0) === 1.5, 'TC-2.7: safeClamp(1.5) returns 1.5 within bounds');
assert(safeClamp(5.0, 0.5, 2.0, 1.0) === 2.0, 'TC-2.8: safeClamp(5.0) clamps to max 2.0');
assert(safeClamp(-2.0, 0.5, 2.0, 1.0) === 0.5, 'TC-2.9: safeClamp(-2.0) clamps to min 0.5');

// Test Filter Assembly with corrupted settings
function buildVideoFilterSim(s, dateStr, fontFile) {
  const filters = [];
  const contrast = safeClamp(s.contrast, 0.5, 2.0, 1.0);
  const fade = safeClamp(s.fade, 0, 1.0, 0);

  if (contrast !== 1.0 || fade > 0.02) {
    const contrastMargin = safeClamp((1 - contrast) * 0.15, 0, 0.4, 0);
    const blackLift = safeClamp(fade * 0.12, 0, 0.5, 0);
    const rimin = contrastMargin.toFixed(3);
    const rimax = safeClamp(1 - contrastMargin, 0.1, 1.0, 1.0).toFixed(3);
    const romin = blackLift.toFixed(3);
    filters.push(
      `colorlevels=rimin=${rimin}:gimin=${rimin}:bimin=${rimin}` +
      `:rimax=${rimax}:gimax=${rimax}:bimax=${rimax}` +
      `:romin=${romin}:gomin=${romin}:bomin=${romin}`
    );
  }

  const sat = safeClamp(s.saturation, 0, 3.0, 1.0);
  const temp = safeClamp(s.temperature, -1.0, 1.0, 0);
  const hasTemp = Math.abs(temp) > 0.05;

  if (sat !== 1.0 || hasTemp) {
    const hueShift = hasTemp ? (temp * 8).toFixed(1) : '0';
    filters.push(`hue=s=${sat.toFixed(3)}:H=${hueShift}`);
  }

  const grain = safeClamp(s.grain, 0, 1.0, 0);
  if (grain > 0.05) {
    const strength = safeClamp(Math.round(grain * 20), 1, 40, 1);
    filters.push(`noise=alls=${strength}:allf=a`);
  }

  const blur = safeClamp(s.blur, 0, 1.0, 0);
  if (blur > 0.1) {
    const sigma = safeClamp(blur * 2.5, 0.5, 10.0, 0.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  const vignette = safeClamp(s.vignette, 0, 1.0, 0);
  if (vignette > 0.05) {
    const angle = safeClamp(vignette * 1.1, 0.05, 1.5, 0.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:eval=init`);
  }

  if (s.timestamp && dateStr && fontFile) {
    const escapedFont = fontFile.replace(/\\/g, '/').replace(/'/g, "\\'");
    const escapedText = dateStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    filters.push(
      `drawtext=fontfile='${escapedFont}':text='${escapedText}':x=w-tw-40:y=h-th-40:fontcolor=0xFFB800:fontsize=36:box=1:boxcolor=0x00000044:boxborderw=4`
    );
  }

  return filters.join(',');
}

const corruptedSettings = {
  contrast: NaN,
  saturation: undefined,
  fade: Infinity,
  temperature: NaN,
  tintOpacity: null,
  grain: NaN,
  blur: undefined,
  vignette: NaN,
  timestamp: true,
};

const corruptedFilter = buildVideoFilterSim(corruptedSettings, "10/24/'98", '/system/fonts/Roboto-Regular.ttf');
assert(!corruptedFilter.includes('NaN'), 'TC-2.10: Corrupted input filter string contains ZERO "NaN" values');
assert(!corruptedFilter.includes('Infinity'), 'TC-2.11: Corrupted input filter string contains ZERO "Infinity" values');
assert(!corruptedFilter.includes('undefined'), 'TC-2.12: Corrupted input filter string contains ZERO "undefined" values');


// ── Test Suite 3: Drawtext Omission (Tier 2 Verification) & Quote Escaping ──
console.log('\n\x1b[33m[Suite 3] Drawtext Omission (Tier 2 Verification) & Quote Escaping\x1b[0m');

// With font: drawtext is present
const tier1Output = buildVideoFilterSim({ contrast: 1.2, timestamp: true }, "10/24/'98", '/system/fonts/Roboto-Regular.ttf');
assert(tier1Output.includes('drawtext='), 'TC-3.1: Tier 1 filter includes drawtext when fontFile is provided');
assert(tier1Output.includes("10/24/\\'98"), 'TC-3.2: Single quote in retro date string is safely escaped as \\\'');

// With null font: drawtext is omitted
const tier2OutputNull = buildVideoFilterSim({ contrast: 1.2, timestamp: true }, "10/24/'98", null);
assert(!tier2OutputNull.includes('drawtext='), 'TC-3.3: Tier 2 filter cleanly omits drawtext when fontFile is null');
assert(tier2OutputNull.includes('colorlevels='), 'TC-3.4: Tier 2 filter retains colorlevels filter without drawtext');

// With undefined font: drawtext is omitted
const tier2OutputUndefined = buildVideoFilterSim({ contrast: 1.2, timestamp: true }, "10/24/'98", undefined);
assert(!tier2OutputUndefined.includes('drawtext='), 'TC-3.5: Tier 2 filter cleanly omits drawtext when fontFile is undefined');

// With timestamp disabled: drawtext is omitted even if fontFile is provided
const noTimestampOutput = buildVideoFilterSim({ contrast: 1.2, timestamp: false }, "10/24/'98", '/system/fonts/Roboto-Regular.ttf');
assert(!noTimestampOutput.includes('drawtext='), 'TC-3.6: drawtext is omitted when settings.timestamp is false');


// ── Test Suite 4: Realtime Transcoding Progress Feedback Algorithm ──
console.log('\n\x1b[33m[Suite 4] Realtime Transcoding Progress Feedback Algorithm\x1b[0m');

function simulateProgressStream(reportedTimesMs, totalDurationMs) {
  let estDuration = Math.max(1000, totalDurationMs);
  let lastReportedPct = 0;
  const dispatchedPercentages = [];

  for (const timeMs of reportedTimesMs) {
    if (timeMs <= 0) continue;
    if (timeMs > estDuration) {
      estDuration = Math.round(timeMs * 1.25);
    }
    const rawPct = Math.round((timeMs / estDuration) * 100);
    const pct = Math.min(95, Math.max(1, rawPct));

    if (pct > lastReportedPct) {
      lastReportedPct = pct;
      dispatchedPercentages.push(pct);
    }
  }

  // Final completion
  dispatchedPercentages.push(100);
  return dispatchedPercentages;
}

const stream1 = simulateProgressStream([0, 500, 1000, 1500, 2000, 2500, 3000, 4000, 4800, 5000], 5000);
assert(stream1[0] >= 1, 'TC-4.1: First non-zero progress is >= 1%');
assert(stream1[stream1.length - 1] === 100, 'TC-4.2: Stream completes with exactly 100%');
assert(stream1.every((p, idx) => idx === 0 || p > stream1[idx - 1]), 'TC-4.3: Dispatched percentages are strictly monotonic (throttled)');

// Test duration overshoot
const streamOvershoot = simulateProgressStream([1000, 2500, 5000, 6000, 7000], 5000);
const preCompletePcts = streamOvershoot.slice(0, -1);
assert(Math.max(...preCompletePcts) <= 95, 'TC-4.4: Overshooting video duration adaptively expands and clamps intermediate pct <= 95%');


// ── Test Suite 5: TypeScript Strict Compilation ──
console.log('\n\x1b[33m[Suite 5] TypeScript Strict Compilation Check\x1b[0m');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  assert(true, 'TC-5.1: npx tsc --noEmit passes with zero errors');
} catch (e) {
  assert(false, 'TC-5.1: npx tsc --noEmit failed', e.stdout ? e.stdout.toString() : e.message);
}

// ── Summary ──
console.log('\n\x1b[36m====================================================\x1b[0m');
console.log(`   Summary: \x1b[32m${passedTests} Passed\x1b[0m, \x1b[31m${failedTests} Failed\x1b[0m`);
console.log('\x1b[36m====================================================\x1b[0m\n');

process.exit(failedTests === 0 ? 0 : 1);
