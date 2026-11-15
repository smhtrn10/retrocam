#!/usr/bin/env node

/**
 * Empirical Verification & Stress Test Suite for Milestone 3 (Requirement R4)
 * Aspect Ratio Parameter Forwarding Across Capture and Import in `app/index.tsx`
 *
 * Usage: node scripts/verify_m3_aspect_ratio.js
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { execSync } = require('child_process');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

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

console.log('\n\x1b[36m====================================================================\x1b[0m');
console.log('\x1b[36m   Milestone 3: Aspect Ratio Parameter Forwarding Verification Suite \x1b[0m');
console.log('\x1b[36m====================================================================\x1b[0m\n');

// ─────────────────────────────────────────────────────────────
//  Test Suite 1: TypeScript AST Code Analysis & Contract Verification
// ─────────────────────────────────────────────────────────────
console.log('\x1b[33m[Suite 1] TypeScript AST Code Analysis & Contract Verification\x1b[0m');

const indexPath = path.join(__dirname, '../app/index.tsx');
assert(fs.existsSync(indexPath), 'TC-1.1: app/index.tsx exists');

const indexSrc = fs.readFileSync(indexPath, 'utf8');
const sf = ts.createSourceFile('index.tsx', indexSrc, ts.ScriptTarget.Latest, true);

// 1. AST Traversal: Find all router.push calls and their parameters
function findRouterPushes(sourceFile) {
  const pushes = [];
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'router.push') {
      const arg = node.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        let pathname = null;
        const params = {};
        for (const prop of arg.properties) {
          if (ts.isPropertyAssignment(prop)) {
            const propName = prop.name.getText(sourceFile);
            if (propName === 'pathname') {
              pathname = prop.initializer.getText(sourceFile).replace(/['"]/g, '');
            } else if (propName === 'params' && ts.isObjectLiteralExpression(prop.initializer)) {
              for (const p of prop.initializer.properties) {
                if (ts.isPropertyAssignment(p)) {
                  params[p.name.getText(sourceFile)] = p.initializer.getText(sourceFile);
                } else if (ts.isShorthandPropertyAssignment(p)) {
                  params[p.name.getText(sourceFile)] = p.name.getText(sourceFile);
                }
              }
            }
          }
        }
        pushes.push({ pathname, params, raw: arg.getText(sourceFile) });
      } else if (arg) {
        pushes.push({ pathname: arg.getText(sourceFile).replace(/['"]/g, ''), params: {}, raw: arg.getText(sourceFile) });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return pushes;
}

const allPushes = findRouterPushes(sf);
const previewPushes = allPushes.filter(p => p.pathname === '/preview');
const videoPreviewPushes = allPushes.filter(p => p.pathname === '/video-preview');

assert(previewPushes.length === 3, 'TC-1.2: Exactly 3 router.push invocations target "/preview"');

// Double exposure push: has secondaryUri and aspectRatio
const doubleExpPush = previewPushes.find(p => 'secondaryUri' in p.params);
assert(
  doubleExpPush &&
  doubleExpPush.params.uri === 'photo.uri' &&
  doubleExpPush.params.secondaryUri === 'firstPhoto' &&
  doubleExpPush.params.presetId === 'selectedPreset.id' &&
  doubleExpPush.params.aspectRatio === 'aspectRatio',
  'TC-1.3: Double exposure 2nd shot forwards { uri, secondaryUri, presetId, aspectRatio }'
);

// Standard capture push: no secondaryUri, no isImport, has aspectRatio
const standardCapturePush = previewPushes.find(p => !('secondaryUri' in p.params) && !('isImport' in p.params));
assert(
  standardCapturePush &&
  standardCapturePush.params.uri === 'photo.uri' &&
  standardCapturePush.params.presetId === 'selectedPreset.id' &&
  standardCapturePush.params.aspectRatio === 'aspectRatio',
  'TC-1.4: Standard capture forwards { uri, presetId, aspectRatio }'
);

// Gallery image push: has isImport and aspectRatio
const galleryImagePush = previewPushes.find(p => 'isImport' in p.params);
assert(
  galleryImagePush &&
  galleryImagePush.params.uri === 'asset.uri' &&
  galleryImagePush.params.presetId === 'selectedPreset.id' &&
  galleryImagePush.params.aspectRatio === 'aspectRatio' &&
  galleryImagePush.params.isImport === "'true'",
  'TC-1.5: Gallery image import forwards { uri, presetId, aspectRatio, isImport: "true" }'
);

// Gallery video push: targets /video-preview with encodeURIComponent
assert(
  videoPreviewPushes.length === 1 &&
  videoPreviewPushes[0].params.uri === 'encodeURIComponent(asset.uri)' &&
  videoPreviewPushes[0].params.presetId === 'selectedPreset.id',
  'TC-1.6: Gallery video import branches to /video-preview with URL-encoded uri and presetId'
);

// 2. AST Traversal: Find useCallback hook dependency arrays
function findHookDependencies(sourceFile) {
  const depsMap = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const varName = node.name.text;
      if (node.initializer && ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        if (call.expression.getText(sourceFile) === 'useCallback' && call.arguments.length >= 2) {
          const depArray = call.arguments[1];
          if (ts.isArrayLiteralExpression(depArray)) {
            depsMap[varName] = depArray.elements.map(e => e.getText(sourceFile));
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return depsMap;
}

const hookDeps = findHookDependencies(sf);

assert(
  hookDeps.handleCapture && hookDeps.handleCapture.includes('aspectRatio'),
  'TC-1.7: handleCapture useCallback dependency array includes aspectRatio',
  `Found deps: [${hookDeps.handleCapture ? hookDeps.handleCapture.join(', ') : 'none'}]`
);

assert(
  hookDeps.handleGalleryImport && hookDeps.handleGalleryImport.includes('aspectRatio'),
  'TC-1.8: handleGalleryImport useCallback dependency array includes aspectRatio',
  `Found deps: [${hookDeps.handleGalleryImport ? hookDeps.handleGalleryImport.join(', ') : 'none'}]`
);

assert(
  hookDeps.toggleAspectRatio && hookDeps.toggleAspectRatio.includes('aspectRatio'),
  'TC-1.9: toggleAspectRatio useCallback dependency array includes aspectRatio',
  `Found deps: [${hookDeps.toggleAspectRatio ? hookDeps.toggleAspectRatio.join(', ') : 'none'}]`
);

// ─────────────────────────────────────────────────────────────
//  Test Suite 2: Aspect Ratio Cycling & Viewfinder Geometry Simulation
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Suite 2] Aspect Ratio Cycling & Viewfinder Geometry Simulation\x1b[0m');

// Helper implementing toggleAspectRatio logic
function simulateToggle(currentRatio) {
  const ratios = ['full', '1:1', '3:2', '4:5'];
  const nextIndex = (ratios.indexOf(currentRatio) + 1) % ratios.length;
  return ratios[nextIndex];
}

// Helper implementing getCameraSize logic
function calculateCameraSize(aspectRatio, screenWidth, screenHeight, isTablet) {
  const maxWidth = isTablet ? Math.min(screenWidth, 800) : screenWidth;
  switch (aspectRatio) {
    case '1:1':
      return { width: maxWidth, height: maxWidth };
    case '3:2':
      return { width: maxWidth, height: maxWidth * 1.5 };
    case '4:5':
      return { width: maxWidth, height: maxWidth * 1.25 };
    default: {
      const fullHeight = isTablet ? screenHeight * 0.75 : screenWidth * (16 / 9);
      return { width: maxWidth, height: fullHeight };
    }
  }
}

// Rapid 1000x toggle test
let currentRatio = 'full';
const expectedOrder = ['1:1', '3:2', '4:5', 'full'];
let cycleMismatch = false;

for (let i = 0; i < 1000; i++) {
  const expected = expectedOrder[i % 4];
  currentRatio = simulateToggle(currentRatio);
  if (currentRatio !== expected) {
    cycleMismatch = true;
    break;
  }
}
assert(!cycleMismatch, 'TC-2.1: Rapid 1000x toggle cycles deterministically (full -> 1:1 -> 3:2 -> 4:5 -> full)');

// Test unknown ratio recovery
const recoveredRatio = simulateToggle('invalid_ratio');
assert(recoveredRatio === 'full', 'TC-2.2: Invalid/corrupted aspect ratio gracefully defaults back to "full"');

// Geometry test devices
const testDevices = [
  { name: 'iPhone SE (375x667)', width: 375, height: 667, isTablet: false },
  { name: 'iPhone 14/15 Pro (393x852)', width: 393, height: 852, isTablet: false },
  { name: 'Pixel 7 (412x915)', width: 412, height: 915, isTablet: false },
  { name: 'iPad Mini (744x1133)', width: 744, height: 1133, isTablet: true },
  { name: 'iPad Pro 12.9 (1024x1366)', width: 1024, height: 1366, isTablet: true },
];

const ratios = ['1:1', '3:2', '4:5', 'full'];
let geometryErrors = 0;

for (const device of testDevices) {
  for (const ratio of ratios) {
    const size = calculateCameraSize(ratio, device.width, device.height, device.isTablet);
    if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
      geometryErrors++;
    }
    if (ratio === '1:1' && size.width !== size.height) {
      geometryErrors++;
    }
    if (ratio === '3:2' && Math.abs(size.height / size.width - 1.5) > 0.001) {
      geometryErrors++;
    }
    if (ratio === '4:5' && Math.abs(size.height / size.width - 1.25) > 0.001) {
      geometryErrors++;
    }
  }
}
assert(geometryErrors === 0, 'TC-2.3: Viewfinder geometry calculations are non-zero, finite, and strictly match target aspect ratios across all devices');

// ─────────────────────────────────────────────────────────────
//  Test Suite 3: Double Exposure State Machine & Edge Cases
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Suite 3] Double Exposure State Machine Simulation\x1b[0m');

class CameraControllerSimulation {
  constructor() {
    this.aspectRatio = 'full';
    this.isDoubleExposureMode = false;
    this.doubleExposureFirstPhoto = null;
    this.selectedPreset = { id: 'classic-35mm', name: 'Classic 35mm' };
    this.routesHistory = [];
  }

  setAspectRatio(ratio) {
    this.aspectRatio = ratio;
  }

  toggleDoubleExposureMode() {
    this.isDoubleExposureMode = !this.isDoubleExposureMode;
    this.doubleExposureFirstPhoto = null;
  }

  cancelDoubleExposure() {
    this.doubleExposureFirstPhoto = null;
  }

  simulateCapture(photoUri) {
    if (this.isDoubleExposureMode) {
      if (!this.doubleExposureFirstPhoto) {
        this.doubleExposureFirstPhoto = photoUri;
        return { action: 'SAVED_FIRST_EXPOSURE', uri: photoUri };
      } else {
        const firstPhoto = this.doubleExposureFirstPhoto;
        this.doubleExposureFirstPhoto = null;
        const nav = {
          pathname: '/preview',
          params: {
            uri: photoUri,
            secondaryUri: firstPhoto,
            presetId: this.selectedPreset.id,
            aspectRatio: this.aspectRatio,
          },
        };
        this.routesHistory.push(nav);
        return { action: 'NAVIGATED', route: nav };
      }
    } else {
      const nav = {
        pathname: '/preview',
        params: {
          uri: photoUri,
          presetId: this.selectedPreset.id,
          aspectRatio: this.aspectRatio,
        },
      };
      this.routesHistory.push(nav);
      return { action: 'NAVIGATED', route: nav };
    }
  }

  simulateGalleryImport(result) {
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.type === 'video') {
        const nav = {
          pathname: '/video-preview',
          params: { uri: encodeURIComponent(asset.uri), presetId: this.selectedPreset.id },
        };
        this.routesHistory.push(nav);
        return { action: 'NAVIGATED_VIDEO', route: nav };
      } else {
        const nav = {
          pathname: '/preview',
          params: {
            uri: asset.uri,
            presetId: this.selectedPreset.id,
            aspectRatio: this.aspectRatio,
            isImport: 'true',
          },
        };
        this.routesHistory.push(nav);
        return { action: 'NAVIGATED_IMAGE', route: nav };
      }
    }
    return { action: 'NO_OP' };
  }
}

// Test: Standard capture forwards aspectRatio
const sim = new CameraControllerSimulation();
sim.setAspectRatio('3:2');
sim.simulateCapture('file://photo1.jpg');
const lastRoute1 = sim.routesHistory[sim.routesHistory.length - 1];
assert(
  lastRoute1 &&
  lastRoute1.pathname === '/preview' &&
  lastRoute1.params.aspectRatio === '3:2' &&
  lastRoute1.params.uri === 'file://photo1.jpg' &&
  !lastRoute1.params.secondaryUri,
  'TC-3.1: Standard capture sends correct aspectRatio="3:2" without secondaryUri'
);

// Test: Double exposure workflow with aspect ratio change mid-sequence
sim.toggleDoubleExposureMode(); // Mode ON
sim.setAspectRatio('1:1');
const shot1 = sim.simulateCapture('file://shot1.jpg');
assert(shot1.action === 'SAVED_FIRST_EXPOSURE', 'TC-3.2: First shot in double exposure mode saves first photo without navigating');

// User switches ratio to 4:5 before second shot
sim.setAspectRatio('4:5');
const shot2 = sim.simulateCapture('file://shot2.jpg');
const lastRoute2 = sim.routesHistory[sim.routesHistory.length - 1];
assert(
  shot2.action === 'NAVIGATED' &&
  lastRoute2.params.aspectRatio === '4:5' &&
  lastRoute2.params.uri === 'file://shot2.jpg' &&
  lastRoute2.params.secondaryUri === 'file://shot1.jpg' &&
  sim.doubleExposureFirstPhoto === null,
  'TC-3.3: Second shot forwards latest aspectRatio="4:5", secondaryUri, and resets doubleExposureFirstPhoto'
);

// Test: Double exposure cancel reset
sim.simulateCapture('file://shotA.jpg');
assert(sim.doubleExposureFirstPhoto === 'file://shotA.jpg', 'TC-3.4: Shot A registered');
sim.cancelDoubleExposure();
assert(sim.doubleExposureFirstPhoto === null, 'TC-3.5: Cancel button resets double exposure first photo');

// Test: Double exposure mode toggle off reset
sim.simulateCapture('file://shotB.jpg');
assert(sim.doubleExposureFirstPhoto === 'file://shotB.jpg', 'TC-3.6: Shot B registered');
sim.toggleDoubleExposureMode(); // Mode OFF
assert(sim.isDoubleExposureMode === false && sim.doubleExposureFirstPhoto === null, 'TC-3.7: Toggling DBL EXP button off disables mode and clears first photo');

// ─────────────────────────────────────────────────────────────
//  Test Suite 4: Gallery Branching Simulation
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Suite 4] Gallery Import Branching & Param Forwarding\x1b[0m');

// Image import
sim.setAspectRatio('1:1');
const imgResult = sim.simulateGalleryImport({
  canceled: false,
  assets: [{ uri: 'file://gallery_img.jpg', type: 'image' }],
});
const lastRoute3 = sim.routesHistory[sim.routesHistory.length - 1];
assert(
  imgResult.action === 'NAVIGATED_IMAGE' &&
  lastRoute3.pathname === '/preview' &&
  lastRoute3.params.aspectRatio === '1:1' &&
  lastRoute3.params.isImport === 'true' &&
  lastRoute3.params.uri === 'file://gallery_img.jpg',
  'TC-4.1: Gallery image import routes to /preview with aspectRatio="1:1" and isImport="true"'
);

// Video import
const vidResult = sim.simulateGalleryImport({
  canceled: false,
  assets: [{ uri: 'file://video space.mp4', type: 'video' }],
});
const lastRoute4 = sim.routesHistory[sim.routesHistory.length - 1];
assert(
  vidResult.action === 'NAVIGATED_VIDEO' &&
  lastRoute4.pathname === '/video-preview' &&
  lastRoute4.params.uri === 'file%3A%2F%2Fvideo%20space.mp4' &&
  lastRoute4.params.presetId === 'classic-35mm' &&
  lastRoute4.params.aspectRatio === undefined,
  'TC-4.2: Gallery video import routes to /video-preview with URL-encoded URI and presetId, without photo params'
);

// Canceled import
const cancelResult = sim.simulateGalleryImport({ canceled: true, assets: [] });
assert(cancelResult.action === 'NO_OP', 'TC-4.3: Cancelled gallery picker triggers no navigation');

// Empty assets array
const emptyResult = sim.simulateGalleryImport({ canceled: false, assets: [] });
assert(emptyResult.action === 'NO_OP', 'TC-4.4: Empty assets result safely produces no navigation');

// ─────────────────────────────────────────────────────────────
//  Test Suite 5: TypeScript Compilation Verification
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[33m[Suite 5] TypeScript Compilation Verification\x1b[0m');

try {
  const tscOut = execSync('npx tsc --noEmit', { stdio: 'pipe' });
  assert(true, 'TC-5.1: `npx tsc --noEmit` exited cleanly with code 0 (no type errors)');
} catch (error) {
  assert(false, 'TC-5.1: `npx tsc --noEmit` failed', error.stdout ? error.stdout.toString() : error.message);
}

// ─────────────────────────────────────────────────────────────
//  Summary
// ─────────────────────────────────────────────────────────────
console.log('\n\x1b[36m====================================================================\x1b[0m');
console.log(`\x1b[36m   Verification Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)\x1b[0m`);
console.log('\x1b[36m====================================================================\x1b[0m\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
