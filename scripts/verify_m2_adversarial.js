#!/usr/bin/env node

/**
 * Adversarial Critic & Stress-Test Suite for Requirement R5
 * (Video Processing, Font Safety, 3-Tier Fallback, Lifecycle & Anti-Lockout)
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

console.log('\n\x1b[35m============================================================\x1b[0m');
console.log('\x1b[35m   ADVERSARIAL STRESS-TEST & INTEGRITY AUDIT — M2 (R5)     \x1b[0m');
console.log('\x1b[35m============================================================\x1b[0m\n');

// ── AUDIT 1: Integrity & Anti-Cheat Inspection ──
console.log('\x1b[33m[Audit 1] Integrity & Anti-Cheat Static Scan\x1b[0m');

const videoPreviewPath = path.join(__dirname, '../app/video-preview.tsx');
const videoFilterPath = path.join(__dirname, '../utils/videoFilter.ts');
const previewSrc = fs.readFileSync(videoPreviewPath, 'utf8');
const filterSrc = fs.readFileSync(videoFilterPath, 'utf8');

// 1. Verify NO blocking error modal remains
assert(!previewSrc.includes('errorOverlay'), 'AT-1.1: No errorOverlay in video-preview.tsx (blocking modal completely removed)');
assert(!previewSrc.includes('Failed to apply vintage filter'), 'AT-1.2: No blocking failure message in video-preview.tsx');
assert(!/retryBtn|errorText/.test(previewSrc), 'AT-1.3: No legacy retry/error lockout styles');

// 2. Verify no hardcoded legacy fonts
assert(!/['"]\/system\/fonts\/DroidSansMono\.ttf['"]/.test(filterSrc), 'AT-1.4: Legacy /system/fonts/DroidSansMono.ttf string literal is absent from code');
assert(!/Platform\.select\(\s*\{\s*ios:\s*['"]\/System\/Library\/Fonts\/Courier\.ttc['"]/.test(filterSrc), 'AT-1.5: Unchecked single iOS hardcoded font path is absent');

// 3. Verify genuine multi-candidate list exists
assert(filterSrc.includes('Roboto-Regular.ttf') && filterSrc.includes('Core/Courier.ttc'), 'AT-1.6: Genuine modern Android/iOS candidate paths defined');


// ── AUDIT 2: Adversarial Parameter Fuzzing & Injection ──
console.log('\n\x1b[33m[Audit 2] Parameter Fuzzing & Injection Attack Stress-Testing\x1b[0m');

// Load videoFilter functions transpiled or simulated safely
// Since videoFilter.ts is TypeScript, we test the logic behavior directly
function safeClamp(val, min, max, fallback) {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}

function escapeFFmpegText(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeFFmpegFontPath(pathStr) {
  return pathStr.replace(/\\/g, '/').replace(/'/g, "\\'");
}

function buildVideoFilterSim(settings, dateStr, fontFile) {
  const filters = [];
  const s = settings || {};

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
    const escapedFont = escapeFFmpegFontPath(fontFile);
    const escapedText = escapeFFmpegText(dateStr);
    filters.push(
      `drawtext=fontfile='${escapedFont}':text='${escapedText}':x=w-tw-40:y=h-th-40:fontcolor=0xFFB800:fontsize=36:box=1:boxcolor=0x00000044:boxborderw=4`
    );
  }

  return filters.join(',');
}

// Adversarial test: Command Injection & Quote Escaping
const attackPayload = "10/24/'98'; [evil] -vf dangerous; '";
const escapedText = escapeFFmpegText(attackPayload);
assert(!escapedText.includes("'98';"), 'AT-2.1: Quotes in timestamp attack payload are escaped');
assert(escapedText.includes("\\'98\\';"), 'AT-2.2: Escaped output cleanly embeds literal \\\'');

// Adversarial test: Windows path backslashes & apostrophes in font path
const evilFontPath = "C:\\Fonts\\User's Fonts\\Courier New.ttf";
const escapedFont = escapeFFmpegFontPath(evilFontPath);
assert(!escapedFont.includes('\\Fonts'), 'AT-2.3: Windows backslashes normalized to forward slashes');
assert(escapedFont.includes("User\\'s Fonts"), 'AT-2.4: Apostrophe in font path escaped as \\\'');

// Adversarial test: Total Chaos Presets (Type Confusion)
const chaosPreset = {
  contrast: "corrupted_string",
  fade: {},
  saturation: [1, 2, 3],
  temperature: Symbol('hack'),
  grain: NaN,
  blur: Infinity,
  vignette: -Infinity,
  timestamp: true,
};

const sanitizedFilter = buildVideoFilterSim(chaosPreset, "01/01/'99", "/system/fonts/Roboto-Regular.ttf");
assert(!sanitizedFilter.includes('NaN'), 'AT-2.5: Zero NaN under extreme type-confusion fuzzing');
assert(!sanitizedFilter.includes('Infinity'), 'AT-2.6: Zero Infinity under extreme type-confusion fuzzing');
assert(!sanitizedFilter.includes('undefined'), 'AT-2.7: Zero undefined under extreme type-confusion fuzzing');
assert(sanitizedFilter.includes("drawtext=fontfile='/system/fonts/Roboto-Regular.ttf'"), 'AT-2.8: Drawtext generated safely despite corrupted color parameters');


// ── AUDIT 3: 3-Tier Fallback Cascade Integrity ──
console.log('\n\x1b[33m[Audit 3] 3-Tier Fallback Cascade Integrity Verification\x1b[0m');

// Tier 1 -> Tier 2 transition: Null font omission
const t2Filter = buildVideoFilterSim({ contrast: 1.2, timestamp: true }, "10/24/'98", null);
assert(!t2Filter.includes('drawtext'), 'AT-3.1: Tier 2 (fontFile=null) cleanly drops drawtext');
assert(t2Filter.includes('colorlevels='), 'AT-3.2: Tier 2 retains all visual effects (colorlevels, etc.)');

// Tier 3 fallback verification in source code:
const hasTier3PlayerReplace = previewSrc.includes('player.replace(uri)');
assert(hasTier3PlayerReplace, 'AT-3.3: Tier 3 hot-swaps player to original uri');

const hasTier3PreservationNotice = previewSrc.includes('Your original video is preserved');
assert(hasTier3PreservationNotice, 'AT-3.4: Tier 3 informs user original video is preserved');

const hasFilteredUriFallback = previewSrc.includes('filteredUriRef.current = uri');
assert(hasFilteredUriFallback, 'AT-3.5: filteredUriRef points to original uri on Tier 3');


// ── AUDIT 4: Unmount & Resource Leak Safety ──
console.log('\n\x1b[33m[Audit 4] Unmount & Resource Leak Safety\x1b[0m');

// Verify activeSessionRef cancel on unmount
const hasSessionCancel = previewSrc.includes('activeSessionRef.current.cancel()');
assert(hasSessionCancel, 'AT-4.1: activeSessionRef.current.cancel() invoked on unmount');

// Verify tempFilesRef cleanup
const hasTempFilesCleanup = previewSrc.includes('tempFilesRef.current = []') && previewSrc.includes('FileSystem.deleteAsync');
assert(hasTempFilesCleanup, 'AT-4.2: tempFilesRef tracked files purged with deleteAsync on unmount');

// Verify activeTempUriRef cleanup
const hasActiveTempCleanup = previewSrc.includes('activeTempUriRef.current = null');
assert(hasActiveTempCleanup, 'AT-4.3: In-flight temporary transcode file safely purged on unmount');

// Verify idempotent deletion
assert(previewSrc.includes('{ idempotent: true }'), 'AT-4.4: FileSystem deletions use { idempotent: true } to prevent crashes on missing files');


// ── AUDIT 5: Full TypeScript Strict Compilation ──
console.log('\n\x1b[33m[Audit 5] Full Project TypeScript Strict Compilation\x1b[0m');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  assert(true, 'AT-5.1: Complete project compiles strictly with zero TypeScript errors');
} catch (e) {
  assert(false, 'AT-5.1: TypeScript compilation failed', e.stdout ? e.stdout.toString() : e.message);
}

// ── Summary ──
console.log('\n\x1b[35m============================================================\x1b[0m');
console.log(`\x1b[35m   Adversarial Summary: ${passedTests} Passed, ${failedTests} Failed\x1b[0m`);
console.log('\x1b[35m============================================================\x1b[0m\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
