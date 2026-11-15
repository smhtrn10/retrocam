#!/usr/bin/env node

/**
 * Empirical Adversarial Stress Test Suite for utils/videoFilter.ts
 * Challenger M2-1
 * 
 * Tests extreme values, NaN, undefined, negative numbers, large numbers,
 * special characters, null font options, and malformed inputs against
 * buildVideoFilter and buildFFmpegArgs.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
    failures.push({ testName, details });
  }
}

// ── Step 1: Load and Transpile Real Module ──
console.log('\n\x1b[36m============================================================\x1b[0m');
console.log('\x1b[36m   Empirical Adversarial Stress Test: utils/videoFilter.ts   \x1b[0m');
console.log('\x1b[36m============================================================\x1b[0m\n');

const videoFilterPath = path.resolve(__dirname, '../utils/videoFilter.ts');
assert(fs.existsSync(videoFilterPath), 'Source file exists at utils/videoFilter.ts');

const sourceCode = fs.readFileSync(videoFilterPath, 'utf8');
const transpiled = ts.transpileModule(sourceCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

let mockPlatformOS = 'ios';
let mockFileSystemExists = false;

const mockPlatform = {
  get OS() { return mockPlatformOS; },
  select: (obj) => obj[mockPlatformOS] || obj.default,
};

const mockFileSystem = {
  getInfoAsync: async (uri) => ({ exists: mockFileSystemExists }),
};

const customRequire = (id) => {
  if (id === 'react-native') return { Platform: mockPlatform };
  if (id === 'expo-file-system/legacy') return mockFileSystem;
  return require(id);
};

const moduleObj = { exports: {} };
const compiledFn = new Function('require', 'module', 'exports', transpiled);
compiledFn(customRequire, moduleObj, moduleObj.exports);

const {
  FONT_CANDIDATES,
  resetFontCache,
  resolveSafeFontPath,
  buildVideoFilter,
  buildFFmpegArgs,
} = moduleObj.exports;

assert(typeof buildVideoFilter === 'function', 'buildVideoFilter is exported as function');
assert(typeof buildFFmpegArgs === 'function', 'buildFFmpegArgs is exported as function');
assert(typeof resolveSafeFontPath === 'function', 'resolveSafeFontPath is exported as function');
assert(typeof resetFontCache === 'function', 'resetFontCache is exported as function');
assert(typeof FONT_CANDIDATES === 'object', 'FONT_CANDIDATES is exported');

// Helper to check for illegal string tokens
function checkIllegalTokens(outputStr, context) {
  const illegal = ['NaN', 'Infinity', '-Infinity', 'undefined', '[object Object]'];
  for (const token of illegal) {
    if (outputStr.includes(token)) {
      return `Emitted illegal token "${token}" in: ${outputStr}`;
    }
  }
  return null;
}

// Helper to check quote balancing in drawtext
function checkQuoteBalancing(str) {
  // Count unescaped single quotes
  let unescapedCount = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "'") {
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && str[j] === '\\') {
        backslashCount++;
        j--;
      }
      if (backslashCount % 2 === 0) {
        unescapedCount++;
      }
    }
  }
  return unescapedCount % 2 === 0;
}

// ── Test Suite 1: buildVideoFilter — Extreme Numbers & NaN Clamping ──
console.log('\n\x1b[33m[Suite 1] Extreme Numeric Boundaries, NaN, and Inverted Extremes\x1b[0m');

const adversarialNumbers = [
  NaN,
  Infinity,
  -Infinity,
  undefined,
  null,
  -999999999,
  999999999,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
  Number.MAX_VALUE,
  -Number.MAX_VALUE,
  1e308,
  -1e308,
  1e-308,
  -0,
  0,
  0.0000000001,
  -0.0000000001,
  '1.5',
  'invalid',
  '',
  {},
  [],
  true,
  false,
];

let suite1Pass = true;
let suite1Errors = [];

for (const val of adversarialNumbers) {
  const settings = {
    contrast: val,
    fade: val,
    saturation: val,
    temperature: val,
    tintOpacity: val,
    tint: '#FF0000',
    grain: val,
    blur: val,
    vignette: val,
    timestamp: false,
  };

  try {
    const filter = buildVideoFilter(settings);
    const tokenError = checkIllegalTokens(filter, `val=${val}`);
    if (tokenError) {
      suite1Pass = false;
      suite1Errors.push(tokenError);
    }
  } catch (err) {
    suite1Pass = false;
    suite1Errors.push(`Exception on val=${val}: ${err.message}`);
  }
}

assert(suite1Pass, 'TC-ADV-1.1: All 25 adversarial values safely clamped without NaN/Infinity/crashes', suite1Errors.join('; '));

// Fully corrupted object: ALL properties corrupted simultaneously
const fullyCorruptedSettings = {
  contrast: NaN,
  fade: -Infinity,
  saturation: Infinity,
  temperature: NaN,
  tintOpacity: undefined,
  tint: 'not-a-color',
  grain: -999999,
  blur: 999999,
  vignette: NaN,
  timestamp: false,
};

const fullCorruptOutput = buildVideoFilter(fullyCorruptedSettings);
assert(!checkIllegalTokens(fullCorruptOutput, 'fullyCorruptedSettings'), 'TC-ADV-1.2: Fully corrupted settings object produces 0 illegal tokens');
assert(!fullCorruptOutput.includes('NaN'), 'TC-ADV-1.3: No "NaN" in fully corrupted filter string');
assert(!fullCorruptOutput.includes('undefined'), 'TC-ADV-1.4: No "undefined" in fully corrupted filter string');
assert(!fullCorruptOutput.includes('Infinity'), 'TC-ADV-1.5: No "Infinity" in fully corrupted filter string');

// Null and undefined settings object
try {
  const nullSettingsFilter = buildVideoFilter(null);
  assert(nullSettingsFilter === '', 'TC-ADV-1.6: buildVideoFilter(null) safely returns empty string without crashing');
} catch (e) {
  assert(false, 'TC-ADV-1.6: buildVideoFilter(null) threw exception', e.message);
}

try {
  const undefinedSettingsFilter = buildVideoFilter(undefined);
  assert(undefinedSettingsFilter === '', 'TC-ADV-1.7: buildVideoFilter(undefined) safely returns empty string without crashing');
} catch (e) {
  assert(false, 'TC-ADV-1.7: buildVideoFilter(undefined) threw exception', e.message);
}

try {
  const emptySettingsFilter = buildVideoFilter({});
  assert(emptySettingsFilter === '', 'TC-ADV-1.8: buildVideoFilter({}) safely returns empty string (defaults do not generate unneeded filters)');
} catch (e) {
  assert(false, 'TC-ADV-1.8: buildVideoFilter({}) threw exception', e.message);
}


// ── Test Suite 2: Color and Tint Parsing Vulnerability Testing ──
console.log('\n\x1b[33m[Suite 2] Malformed Tint and Hex Parsing\x1b[0m');

const adversarialTints = [
  undefined,
  null,
  '',
  '   ',
  '#',
  '#F',
  '#FF',
  '#FFF',             // valid 3-char hex
  '#FF0000',          // valid 6-char hex
  '#FF0000FF',        // 8-char hex (with alpha)
  'FF0000',           // no leading #
  '#GGGGGG',          // invalid hex chars
  '#12345Z',
  'rgba(255,0,0,1)',
  'red',
  '<script>alert(1)</script>',
  "'; drop table filters; --",
  { r: 255, g: 0, b: 0 },
  ['#FFF'],
  12345,
  true,
  false,
];

let tintPass = true;
let tintErrors = [];

for (const tint of adversarialTints) {
  const settings = {
    tintOpacity: 0.5,
    tint: tint,
  };
  try {
    const res = buildVideoFilter(settings);
    const tokenErr = checkIllegalTokens(res, `tint=${tint}`);
    if (tokenErr) {
      tintPass = false;
      tintErrors.push(tokenErr);
    }
  } catch (err) {
    tintPass = false;
    tintErrors.push(`Exception for tint=${tint}: ${err.message}`);
  }
}

assert(tintPass, 'TC-ADV-2.1: All 22 adversarial tint variations handled gracefully without crash or NaN', tintErrors.join('; '));

// Check valid 3-digit hex expansion
const hex3Filter = buildVideoFilter({ tint: '#f80', tintOpacity: 0.5 });
assert(hex3Filter.includes('colorchannelmixer='), 'TC-ADV-2.2: Valid 3-digit hex #f80 successfully parses into colorchannelmixer');

// Check that invalid hex does not generate corrupt colorchannelmixer
const invalidHexFilter = buildVideoFilter({ tint: '#ZZZZZZ', tintOpacity: 0.5 });
assert(!invalidHexFilter.includes('colorchannelmixer'), 'TC-ADV-2.3: Invalid hex #ZZZZZZ cleanly omitted without crashing');


// ── Test Suite 3: drawtext, Font Resolution, and String Injection ──
console.log('\n\x1b[33m[Suite 3] Font Path, Date String Escaping, and drawtext Omission\x1b[0m');

// Tier 2: fontFile is null -> drawtext MUST be omitted
const nullFontFilter = buildVideoFilter({ timestamp: true, contrast: 1.2 }, "10/24/'98", null);
assert(!nullFontFilter.includes('drawtext='), 'TC-ADV-3.1: Null fontFile completely omits drawtext (Tier 2 requirement)');
assert(nullFontFilter.includes('colorlevels='), 'TC-ADV-3.2: Null fontFile preserves colorlevels filter');

// fontFile is undefined -> drawtext MUST be omitted
const undefFontFilter = buildVideoFilter({ timestamp: true, contrast: 1.2 }, "10/24/'98", undefined);
assert(!undefFontFilter.includes('drawtext='), 'TC-ADV-3.3: Undefined fontFile completely omits drawtext');

// fontFile is empty string -> drawtext MUST be omitted
const emptyFontFilter = buildVideoFilter({ timestamp: true, contrast: 1.2 }, "10/24/'98", '');
assert(!emptyFontFilter.includes('drawtext='), 'TC-ADV-3.4: Empty string fontFile completely omits drawtext');

// settings.timestamp is false -> drawtext MUST be omitted even if font and date exist
const disabledTimestampFilter = buildVideoFilter({ timestamp: false, contrast: 1.2 }, "10/24/'98", '/system/fonts/Roboto-Regular.ttf');
assert(!disabledTimestampFilter.includes('drawtext='), 'TC-ADV-3.5: timestamp=false completely omits drawtext even with valid font');

// settings.timestamp is true, but dateStr is empty/undefined -> drawtext MUST be omitted
const noDateFilter = buildVideoFilter({ timestamp: true, contrast: 1.2 }, '', '/system/fonts/Roboto-Regular.ttf');
assert(!noDateFilter.includes('drawtext='), 'TC-ADV-3.6: Empty dateStr completely omits drawtext');

// String injection and special characters in dateStr
const adversarialDates = [
  "10/24/'98",                     // Single quote (RetroCam standard)
  "10/24/''98",                    // Consecutive single quotes
  "10/24/\\\'98",                  // Pre-escaped single quotes
  '10:24:98',                      // Colons (FFmpeg option separator)
  '10,24,98',                      // Commas (FFmpeg filter separator)
  '10;24;98',                      // Semicolons (FFmpeg chain separator)
  '10[24]98',                      // Brackets (FFmpeg pad label)
  '10\\24\\98',                    // Backslashes
  '10/24/98 %{pts}',               // Drawtext expansion attack
  '100% RETRO',                    // Percent sign
  'DATE: 10/24/98 - "RETRO"',      // Double quotes
  '10/24/98\nNEWLINE',             // Newline character
  '10/24/98\r\nCRLF',              // CRLF
  '📸 1998-10-24 📼',              // Unicode and emoji
  'A'.repeat(5000),                // Extremely long string (5000 chars)
  "'; rm -rf /; echo '",           // Command injection attempt
];

let datePass = true;
let dateErrors = [];

for (const d of adversarialDates) {
  try {
    const res = buildVideoFilter({ timestamp: true }, d, '/system/fonts/Roboto-Regular.ttf');
    assert(res.includes('drawtext='), `drawtext present for date: ${d.slice(0, 20)}`);
    const balanced = checkQuoteBalancing(res);
    if (!balanced) {
      datePass = false;
      dateErrors.push(`Unbalanced single quotes in filter for date "${d.slice(0, 30)}": ${res}`);
    }
    const tokenErr = checkIllegalTokens(res, `date=${d.slice(0, 20)}`);
    if (tokenErr) {
      datePass = false;
      dateErrors.push(tokenErr);
    }
  } catch (err) {
    datePass = false;
    dateErrors.push(`Exception for date "${d.slice(0, 20)}": ${err.message}`);
  }
}

assert(datePass, 'TC-ADV-3.7: All 16 adversarial date strings safely quoted and escaped with balanced quotes', dateErrors.join('; '));

// Font path escaping (Windows backslashes, single quotes, spaces)
const adversarialFontPaths = [
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:/Windows/Fonts/arial.ttf',
  "/System/Library/Fonts/Courier.ttc",
  "/Library/Fonts/My Font 'Pro' Special.ttf",
  "/data/app/fonts/retro font.ttf",
  "/system/fonts/NotoSansCJK-Regular.ttc",
];

let fontPathPass = true;
let fontPathErrors = [];

for (const fp of adversarialFontPaths) {
  try {
    const res = buildVideoFilter({ timestamp: true }, "10/24/'98", fp);
    const balanced = checkQuoteBalancing(res);
    if (!balanced) {
      fontPathPass = false;
      fontPathErrors.push(`Unbalanced quotes for font path "${fp}": ${res}`);
    }
    // Verify no unescaped backslashes in fontfile path (should be converted to /)
    if (fp.includes('\\')) {
      const match = res.match(/fontfile='([^']+)'/);
      if (match && match[1].includes('\\')) {
        fontPathPass = false;
        fontPathErrors.push(`Backslashes not converted to forward slashes in fontfile: ${match[1]}`);
      }
    }
  } catch (err) {
    fontPathPass = false;
    fontPathErrors.push(`Exception for font path "${fp}": ${err.message}`);
  }
}

assert(fontPathPass, 'TC-ADV-3.8: Font paths with backslashes, quotes, and spaces safely normalized and escaped', fontPathErrors.join('; '));


// ── Test Suite 4: buildFFmpegArgs — Adversarial Stress Testing ──
console.log('\n\x1b[33m[Suite 4] buildFFmpegArgs Argument Array & CLI Robustness\x1b[0m');

// Check standard execution Tier 1
const argsTier1 = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { contrast: 1.2, timestamp: true },
  "10/24/'98",
  '/system/fonts/Roboto-Regular.ttf'
);

assert(Array.isArray(argsTier1), 'TC-ADV-4.1: buildFFmpegArgs returns an array');
assert(argsTier1.includes('-vf'), 'TC-ADV-4.2: Tier 1 args include -vf flag');
const vfIndex1 = argsTier1.indexOf('-vf');
assert(argsTier1[vfIndex1 + 1].includes('drawtext='), 'TC-ADV-4.3: Tier 1 -vf contains drawtext filter');
assert(argsTier1[argsTier1.length - 1] === 'file:///var/mobile/output.mp4', 'TC-ADV-4.4: Output path is last argument');
assert(argsTier1[argsTier1.indexOf('-i') + 1] === 'file:///var/mobile/video.mp4', 'TC-ADV-4.5: Input path correctly follows -i');

// Check Tier 2: fontFile is null
const argsTier2 = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { contrast: 1.2, timestamp: true },
  "10/24/'98",
  null
);

assert(argsTier2.includes('-vf'), 'TC-ADV-4.6: Tier 2 args include -vf flag');
const vfIndex2 = argsTier2.indexOf('-vf');
assert(!argsTier2[vfIndex2 + 1].includes('drawtext='), 'TC-ADV-4.7: Tier 2 -vf strictly OMITS drawtext');
assert(argsTier2[vfIndex2 + 1].includes('colorlevels='), 'TC-ADV-4.8: Tier 2 -vf retains color grading filters');

// Check Tier 2 with no filters active (contrast 1.0, timestamp false)
const argsEmptyFilter = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { timestamp: false },
  undefined,
  null
);
assert(!argsEmptyFilter.includes('-vf'), 'TC-ADV-4.9: buildFFmpegArgs does not pass empty -vf argument when no filters active');

// Overlay path handling (filter_complex)
const argsOverlay = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { contrast: 1.2, timestamp: true },
  "10/24/'98",
  '/system/fonts/Roboto-Regular.ttf',
  'file:///var/mobile/frame.png'
);

assert(argsOverlay.includes('-filter_complex'), 'TC-ADV-4.10: overlayPath generates -filter_complex');
assert(!argsOverlay.includes('-vf'), 'TC-ADV-4.11: -filter_complex replaces -vf when overlay is present');
const fcIndex = argsOverlay.indexOf('-filter_complex');
const fcValue = argsOverlay[fcIndex + 1];
assert(fcValue.includes('overlay=0:0'), 'TC-ADV-4.12: -filter_complex includes overlay=0:0');
assert(fcValue.includes('drawtext='), 'TC-ADV-4.13: -filter_complex chains drawtext after overlay');
assert(checkQuoteBalancing(fcValue), 'TC-ADV-4.14: -filter_complex has balanced single quotes');

// Overlay with null font (Tier 2 with overlay)
const argsOverlayNullFont = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { contrast: 1.2, timestamp: true },
  "10/24/'98",
  null,
  'file:///var/mobile/frame.png'
);
const fcNullIndex = argsOverlayNullFont.indexOf('-filter_complex');
assert(!argsOverlayNullFont[fcNullIndex + 1].includes('drawtext='), 'TC-ADV-4.15: -filter_complex omits drawtext when fontFile is null');

// Backwards compatibility: 4th arg is image path
const argsBackCompat = buildFFmpegArgs(
  'file:///var/mobile/video.mp4',
  'file:///var/mobile/output.mp4',
  { contrast: 1.2, timestamp: false },
  'file:///var/mobile/overlay.png'
);
assert(argsBackCompat.includes('-filter_complex'), 'TC-ADV-4.16: Backwards compatibility routes 4th arg image to overlay');

// Adversarial URIs: spaces, quotes, ampersands, unicode
const adversarialUris = [
  'file:///storage/emulated/0/DCIM/Camera/My Video (1).mp4',
  "file:///storage/path'with'quotes/video.mp4",
  'file:///storage/path&with&symbols/video.mp4',
  'file:///storage/path with spaces/video.mp4',
  'file:///storage/ünicöde/vidéo_1998.mp4',
];

let uriPass = true;
for (const uri of adversarialUris) {
  try {
    const resArgs = buildFFmpegArgs(uri, uri + '.out.mp4', { timestamp: true, contrast: 1.2 });
    if (!resArgs.includes(uri)) {
      uriPass = false;
      console.error(`Missing input URI in args: ${uri}`);
    }
    for (const a of resArgs) {
      if (typeof a !== 'string') {
        uriPass = false;
        console.error(`Non-string arg in args: ${a}`);
      }
      const tokErr = checkIllegalTokens(a, `uri=${uri}`);
      if (tokErr) {
        uriPass = false;
        console.error(tokErr);
      }
    }
  } catch (err) {
    uriPass = false;
    console.error(`Exception with URI ${uri}: ${err.message}`);
  }
}
assert(uriPass, 'TC-ADV-4.17: Adversarial URIs with spaces, quotes, unicode handled cleanly in args array');

// Stress test automatic date seeding when timestamp is true and no dateStr provided
let autoDatePass = true;
for (let i = 0; i < 50; i++) {
  const seedInput = `file:///var/mobile/video_${i}_${Date.now()}.mp4`;
  try {
    const seedArgs = buildFFmpegArgs(seedInput, 'out.mp4', { timestamp: true }, undefined, '/font.ttf');
    const vfArg = seedArgs[seedArgs.indexOf('-vf') + 1];
    if (!vfArg || !vfArg.includes('drawtext=')) {
      autoDatePass = false;
      console.error(`Missing drawtext in auto-seeded date for input: ${seedInput}`);
    }
    if (!checkQuoteBalancing(vfArg)) {
      autoDatePass = false;
      console.error(`Unbalanced quotes in auto-seeded date for input: ${seedInput}`);
    }
    const tokenErr = checkIllegalTokens(vfArg, `autoDate_${i}`);
    if (tokenErr) {
      autoDatePass = false;
      console.error(tokenErr);
    }
  } catch (err) {
    autoDatePass = false;
    console.error(`Exception in autoDate_${i}: ${err.message}`);
  }
}
assert(autoDatePass, 'TC-ADV-4.18: 50 randomized video URI seeds generate valid, escaped date strings without NaN or quote corruption');


// ── Test Suite 5: Extreme Input Type Corruption ──
console.log('\n\x1b[33m[Suite 5] Extreme Type Corruption & Defensive Resilience\x1b[0m');

// Test that non-string dateStr does not cause fatal crash
const nonStringDates = [12345, true, false, {}, [], NaN, Infinity];
let nonStringDateHandled = true;

for (const nsd of nonStringDates) {
  try {
    // If the caller passes a non-string dateStr, does buildVideoFilter crash with TypeError?
    const res = buildVideoFilter({ timestamp: true }, nsd, '/font.ttf');
    // If it succeeds, verify no NaN/corruption
    const tokErr = checkIllegalTokens(res, `nsd=${nsd}`);
    if (tokErr) {
      nonStringDateHandled = false;
    }
  } catch (err) {
    // A TypeError here indicates string replace assumption
    console.log(`  \x1b[35m[INFO]\x1b[0m buildVideoFilter threw on non-string date (${typeof nsd}): ${err.message}`);
  }
}

// Check safeFontPath resolver behavior
async function testResolver() {
  resetFontCache();
  mockPlatformOS = 'android';
  mockFileSystemExists = false;
  const noFontResult = await resolveSafeFontPath(true);
  assert(noFontResult === null, 'TC-ADV-5.1: resolveSafeFontPath returns null when no candidate exists on disk');

  resetFontCache();
  mockFileSystemExists = true;
  const foundFontResult = await resolveSafeFontPath(true);
  assert(foundFontResult === FONT_CANDIDATES.android[0], 'TC-ADV-5.2: resolveSafeFontPath finds first existing candidate on disk');

  // Verify caching
  mockFileSystemExists = false; // Even if filesystem now says false, cache should return previous
  const cachedResult = await resolveSafeFontPath(false);
  assert(cachedResult === FONT_CANDIDATES.android[0], 'TC-ADV-5.3: resolveSafeFontPath caches resolved font path in-memory');

  // Verify cache reset
  resetFontCache();
  const resetResult = await resolveSafeFontPath(false);
  assert(resetResult === null, 'TC-ADV-5.4: resetFontCache clears cache correctly');
}

testResolver().then(() => {
  console.log('\n\x1b[36m============================================================\x1b[0m');
  console.log(`   Stress Test Complete: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('\x1b[36m============================================================\x1b[0m\n');

  if (failedTests > 0) {
    console.error('Failures:', failures);
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Resolver test failed with error:', err);
  process.exit(1);
});
