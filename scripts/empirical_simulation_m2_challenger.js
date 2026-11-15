#!/usr/bin/env node

/**
 * Empirical Simulation & Stress-Test Harness for Requirement R5
 * Author: Challenger M2-2 (Adversarial Empirical Verification)
 * 
 * Verifies:
 *   - Tier 1 failure fallback to Tier 2 (font failure -> drawtext omission)
 *   - Tier 2 failure fallback to Tier 3 (transcode failure -> original video preservation)
 *   - Unmount safety & async session cancellation (no leaks, no zombie sessions)
 *   - Progress monotonicity & adaptive duration expansion
 *   - Non-blocking anti-lockout UI and original video accessibility
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
    failureDetails.push({ testName, details });
  }
}

console.log('\n\x1b[36m======================================================================\x1b[0m');
console.log('\x1b[36m   CHALLENGER M2-2: EMPIRICAL SIMULATION & STRESS-TEST HARNESS       \x1b[0m');
console.log('\x1b[36m   (3-Tier Fallback, Unmount Lifecycle Safety & Progress Monotonicity)\x1b[0m');
console.log('\x1b[36m======================================================================\x1b[0m\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. MOCK ENVIRONMENT & TRANSTYPE COMPILATION OF utils/videoFilter.ts
// ─────────────────────────────────────────────────────────────────────────────

// Virtual in-memory filesystem to accurately observe created/deleted files
class VirtualFileSystem {
  constructor() {
    this.files = new Map(); // path -> { size: number, exists: boolean }
    this.cacheDirectory = 'file:///data/user/0/com.retrocam/cache/';
    this.documentDirectory = 'file:///data/user/0/com.retrocam/documents/';
  }

  async getInfoAsync(uri) {
    const f = this.files.get(uri);
    if (!f) return { exists: false, size: 0 };
    return { exists: f.exists, size: f.size };
  }

  async deleteAsync(uri, options = {}) {
    if (this.files.has(uri)) {
      this.files.delete(uri);
    } else if (!options.idempotent) {
      throw new Error(`File does not exist: ${uri}`);
    }
  }

  createFile(uri, size = 1024) {
    this.files.set(uri, { exists: true, size });
  }

  hasFile(uri) {
    return this.files.has(uri) && this.files.get(uri).exists;
  }

  countFilesInCache() {
    let count = 0;
    for (const [key, val] of this.files.entries()) {
      if (key.startsWith(this.cacheDirectory) && val.exists) {
        count++;
      }
    }
    return count;
  }

  reset() {
    this.files.clear();
  }
}

const vfs = new VirtualFileSystem();
let currentPlatform = 'android';

// Hook Module._load to inject virtual react-native and expo-file-system
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native') {
    return {
      Platform: {
        get OS() { return currentPlatform; },
        select: (obj) => obj[currentPlatform] || obj.default,
      },
    };
  }
  if (request.includes('expo-file-system')) {
    return {
      getInfoAsync: (uri) => vfs.getInfoAsync(uri),
      deleteAsync: (uri, opts) => vfs.deleteAsync(uri, opts),
      get cacheDirectory() { return vfs.cacheDirectory; },
      get documentDirectory() { return vfs.documentDirectory; },
    };
  }
  return originalLoad.apply(this, arguments);
};

// Transpile and load genuine utils/videoFilter.ts
const videoFilterTsPath = path.join(__dirname, '../utils/videoFilter.ts');
const videoFilterTsCode = fs.readFileSync(videoFilterTsPath, 'utf8');
const transpiledVideoFilter = babel.transformSync(videoFilterTsCode, {
  presets: ['babel-preset-expo'],
  filename: 'videoFilter.ts',
}).code;

const videoFilterModule = new Module('videoFilter.ts');
videoFilterModule.paths = Module._nodeModulePaths(process.cwd());
videoFilterModule._compile(transpiledVideoFilter, 'videoFilter.ts');

const {
  FONT_CANDIDATES,
  resolveSafeFontPath,
  resetFontCache,
  buildVideoFilter,
  buildFFmpegArgs,
} = videoFilterModule.exports;

// ─────────────────────────────────────────────────────────────────────────────
// 2. MOCK FFMPEG-KIT & ASYNC SESSION EMULATOR
// ─────────────────────────────────────────────────────────────────────────────

class MockFFmpegSession {
  constructor(id, args, behavior = {}) {
    this.id = id;
    this.args = args;
    this.behavior = behavior; // { succeed: bool, failTier1: bool, failTier2: bool, durationMs: number, ptsStream: number[] }
    this.cancelled = false;
    this.completed = false;
  }

  async getReturnCode() {
    return {
      isValueSuccess: () => !this.cancelled && this.behavior.succeed,
      getValue: () => (this.cancelled ? 255 : this.behavior.succeed ? 0 : 1),
    };
  }

  async getLogs() {
    return [
      { getMessage: () => this.behavior.logMessage || 'Mock FFmpeg execution log' }
    ];
  }

  cancel() {
    this.cancelled = true;
  }
}

class MockFFmpegKit {
  constructor() {
    this.sessionIdCounter = 1;
    this.sessions = [];
    this.activeSession = null;
    this.cancelledCount = 0;
    this.globalCancelCount = 0;
    this.behavior = {
      succeedTier1: true,
      succeedTier2: true,
      ptsStream: [500, 1500, 3000, 4500, 5000],
      logMessage: '',
      delayMs: 10,
    };
  }

  async executeWithArgumentsAsync(args, completeCallback, logCallback, statisticsCallback) {
    const isTier1 = args.some(a => a.includes('drawtext='));
    const isTier2 = !isTier1;

    const willSucceed = isTier1 ? this.behavior.succeedTier1 : this.behavior.succeedTier2;
    const session = new MockFFmpegSession(this.sessionIdCounter++, args, {
      succeed: willSucceed,
      logMessage: willSucceed ? 'OK' : isTier1 ? 'Cannot find a valid font file' : 'Complex filter out of memory',
    });

    this.sessions.push(session);
    this.activeSession = session;

    // Simulate async processing
    setTimeout(async () => {
      if (session.cancelled) return;

      // Stream statistics if available
      if (statisticsCallback && this.behavior.ptsStream) {
        for (const timeMs of this.behavior.ptsStream) {
          if (session.cancelled) break;
          statisticsCallback({
            getTime: () => timeMs,
            getVideoFrameNumber: () => Math.round(timeMs / 33),
            getVideoFps: () => 30,
            getSpeed: () => 1.5,
          });
        }
      }

      // Simulate output file creation if it succeeds
      if (willSucceed && !session.cancelled) {
        const outUri = args[args.length - 1];
        vfs.createFile(`file://${outUri}`, 500000);
      }

      if (completeCallback) {
        await completeCallback(session);
      }
    }, this.behavior.delayMs);

    return session;
  }

  cancel() {
    this.globalCancelCount++;
    if (this.activeSession) {
      this.activeSession.cancel();
    }
  }
}

const mockReturnCode = {
  isSuccess: (rc) => rc && rc.isValueSuccess && rc.isValueSuccess(),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPONENT LIFECYCLE & STATE MACHINE HARNESS (SIMULATING VideoPreviewScreen)
// ─────────────────────────────────────────────────────────────────────────────

class SimulatedVideoPreviewComponent {
  constructor(config = {}) {
    this.uri = config.uri || 'file:///data/user/0/com.retrocam/cache/Camera/raw_rec_001.mp4';
    this.preset = config.preset || {
      id: 'classic-35mm',
      name: '1998 Cam',
      settings: {
        contrast: 1.2,
        saturation: 1.1,
        grain: 0.3,
        vignette: 0.2,
        timestamp: true,
        retroDate: "05/14/'98",
        tint: '#FFB800',
        tintOpacity: 0.2,
      },
    };

    this.ffmpegKit = config.ffmpegKit !== undefined ? config.ffmpegKit : new MockFFmpegKit();

    // State
    this.isProcessing = false;
    this.progress = 0;
    this.processingStep = '';
    this.transcodeStats = null;
    this.filteredUri = null;
    this.filterApplied = false;
    this.fallbackNotice = null;
    this.isSaving = false;
    this.isSharing = false;

    // Dispatched progress history for monotonicity verification
    this.dispatchedProgressHistory = [];

    // Refs
    this.isMounted = { current: true };
    this.activeSessionRef = { current: null };
    this.activeTempUriRef = { current: null };
    this.tempFilesRef = { current: [] };
    this.filteredUriRef = { current: this.uri };

    // Mock Video Player
    this.player = {
      duration: 5.0, // 5 seconds
      currentSource: this.uri,
      replace: (newSource) => {
        this.player.currentSource = newSource;
      },
    };

    // Actions log
    this.savedUris = [];
    this.sharedUris = [];

    this.debounceTimer = null;
  }

  // Helper matching VideoPreviewScreen getSafePath
  getSafePath(uri) {
    if (!uri) return '';
    return uri.replace(/^file:\/\//, '');
  }

  // Exact runFFmpegAsync logic from VideoPreviewScreen
  runFFmpegAsync(args, estimatedDurationMs, onProgress) {
    return new Promise(async (resolve) => {
      if (!this.ffmpegKit) {
        resolve({ success: false, logs: 'FFmpegKit not available' });
        return;
      }
      try {
        let estDuration = Math.max(1000, estimatedDurationMs);
        let lastReportedPct = 0;

        const session = await this.ffmpegKit.executeWithArgumentsAsync(
          args,
          async (completedSession) => {
            this.activeSessionRef.current = null;
            const returnCode = await completedSession.getReturnCode();
            const success = mockReturnCode.isSuccess(returnCode);
            let logs = '';
            if (success) {
              onProgress(100, { frames: 0, fps: 0, timeMs: estDuration, speed: 1 });
            } else {
              const sessionLogs = await completedSession.getLogs();
              logs = sessionLogs?.slice(-10).map((l) => l.getMessage()).join('\n') || 'Unknown error';
            }
            resolve({ success, session: completedSession, logs });
          },
          () => {},
          (statistics) => {
            if (!statistics || !this.isMounted.current) return;
            const timeMs = statistics.getTime();
            if (timeMs <= 0) return;

            if (timeMs > estDuration) {
              estDuration = Math.round(timeMs * 1.25);
            }

            const rawPct = Math.round((timeMs / estDuration) * 100);
            const pct = Math.min(95, Math.max(1, rawPct));

            if (pct > lastReportedPct) {
              lastReportedPct = pct;
              onProgress(pct, {
                frames: statistics.getVideoFrameNumber() || 0,
                fps: statistics.getVideoFps() || 0,
                timeMs,
                speed: statistics.getSpeed() || 0,
              });
            }
          }
        );
        this.activeSessionRef.current = session;
      } catch (err) {
        this.activeSessionRef.current = null;
        resolve({ success: false, logs: err?.message || 'Execution error' });
      }
    });
  }

  // Exact mount & 3-Tier processVideo implementation from VideoPreviewScreen
  mount() {
    this.isMounted.current = true;

    if (!this.uri) return;

    if (!this.ffmpegKit) {
      this.filteredUriRef.current = this.uri;
      this.filteredUri = null;
      this.filterApplied = false;
      this.isProcessing = false;
      this.fallbackNotice = 'Video filter unavailable in this environment. Showing original video.';
      return;
    }

    let active = true;

    const processVideo = async () => {
      if (!active || !this.isMounted.current) return;
      this.isProcessing = true;
      this.progress = 0;
      this.fallbackNotice = null;
      this.processingStep = 'LOADING FILM PROFILE...';

      const rawInputPath = this.getSafePath(this.uri);
      const cacheDir = vfs.cacheDirectory;

      if (this.activeTempUriRef.current) {
        await vfs.deleteAsync(this.activeTempUriRef.current, { idempotent: true }).catch(() => {});
        this.activeTempUriRef.current = null;
      }

      const estimatedDurationMs = Math.round(
        ((this.player?.duration && this.player.duration > 0 ? this.player.duration : 0) || 10) * 1000
      );

      const onProgress = (pct, stats) => {
        if (!active || !this.isMounted.current) return;
        this.progress = pct;
        this.dispatchedProgressHistory.push(pct);
        this.transcodeStats = stats;
        if (pct < 15) this.processingStep = 'LOADING FILM PROFILE...';
        else if (pct < 65) this.processingStep = 'DEVELOPING GRAIN & COLOR...';
        else if (pct < 95) this.processingStep = 'ENCODING AUDIO & VIDEO...';
        else this.processingStep = 'FINALIZING CASSETTE...';
      };

      let safeFont = null;
      try {
        safeFont = await resolveSafeFontPath();
      } catch {
        safeFont = null;
      }

      const dateStr = this.preset.settings.timestamp ? (this.preset.settings.retroDate || undefined) : undefined;

      // ─────────────────────────────────────────────
      // TIER 1
      // ─────────────────────────────────────────────
      let tier1Success = false;
      const canAttemptTier1 = Boolean(this.preset.settings.timestamp && safeFont);

      if (canAttemptTier1) {
        const outUriT1 = `${cacheDir}retrocam_v_t1_${Date.now()}.mp4`;
        this.activeTempUriRef.current = outUriT1;

        try {
          const argsT1 = buildFFmpegArgs(rawInputPath, this.getSafePath(outUriT1), this.preset.settings, dateStr, safeFont);
          const resultT1 = await this.runFFmpegAsync(argsT1, estimatedDurationMs, onProgress);

          if (active && this.isMounted.current && resultT1.success) {
            const fileInfo = await vfs.getInfoAsync(outUriT1);
            if (fileInfo.exists && fileInfo.size > 0) {
              this.tempFilesRef.current.push(outUriT1);
              this.filteredUriRef.current = outUriT1;
              this.filteredUri = outUriT1;
              this.filterApplied = true;
              this.activeTempUriRef.current = null;
              tier1Success = true;
            }
          }
        } catch (e) {
          // ignore
        }

        if (!tier1Success && this.activeTempUriRef.current === outUriT1) {
          await vfs.deleteAsync(outUriT1, { idempotent: true }).catch(() => {});
          this.activeTempUriRef.current = null;
        }
      }

      if (tier1Success || !active || !this.isMounted.current) {
        if (active && this.isMounted.current) this.isProcessing = false;
        return;
      }

      // ─────────────────────────────────────────────
      // TIER 2
      // ─────────────────────────────────────────────
      if (active && this.isMounted.current) {
        this.processingStep = 'COMPATIBILITY DEVELOPING (NO TEXT)...';
        this.progress = 10;
        this.dispatchedProgressHistory.push(10);
      }

      let tier2Success = false;
      const outUriT2 = `${cacheDir}retrocam_v_t2_${Date.now()}.mp4`;
      this.activeTempUriRef.current = outUriT2;

      try {
        const argsT2 = buildFFmpegArgs(rawInputPath, this.getSafePath(outUriT2), this.preset.settings, dateStr, null);
        const resultT2 = await this.runFFmpegAsync(argsT2, estimatedDurationMs, onProgress);

        if (active && this.isMounted.current && resultT2.success) {
          const fileInfo = await vfs.getInfoAsync(outUriT2);
          if (fileInfo.exists && fileInfo.size > 0) {
            this.tempFilesRef.current.push(outUriT2);
            this.filteredUriRef.current = outUriT2;
            this.filteredUri = outUriT2;
            this.filterApplied = true;
            this.activeTempUriRef.current = null;
            tier2Success = true;
            if (this.preset.settings.timestamp) {
              this.fallbackNotice = 'Timestamp omitted due to system font compatibility.';
            }
          }
        }
      } catch (e) {
        // ignore
      }

      if (!tier2Success && this.activeTempUriRef.current === outUriT2) {
        await vfs.deleteAsync(outUriT2, { idempotent: true }).catch(() => {});
        this.activeTempUriRef.current = null;
      }

      if (tier2Success || !active || !this.isMounted.current) {
        if (active && this.isMounted.current) this.isProcessing = false;
        return;
      }

      // ─────────────────────────────────────────────
      // TIER 3
      // ─────────────────────────────────────────────
      if (active && this.isMounted.current) {
        this.filteredUriRef.current = this.uri;
        this.filteredUri = null;
        this.filterApplied = false;
        this.isProcessing = false;
        this.fallbackNotice = 'Video filter unavailable. Your original video is preserved.';
        if (this.player) {
          this.player.replace(this.uri);
        }
      }
    };

    this.debounceTimer = setTimeout(processVideo, 20); // Fast timer for simulation

    this.cleanupEffect = () => {
      active = false;
      clearTimeout(this.debounceTimer);
      if (this.activeSessionRef.current) {
        try { this.activeSessionRef.current.cancel(); } catch {}
        this.activeSessionRef.current = null;
      }
      if (this.activeTempUriRef.current) {
        const file = this.activeTempUriRef.current;
        this.activeTempUriRef.current = null;
        vfs.deleteAsync(file, { idempotent: true }).catch(() => {});
      }
    };
  }

  // Exact unmount cleanup from VideoPreviewScreen lines 90-120
  unmount() {
    this.isMounted.current = false;
    if (this.cleanupEffect) this.cleanupEffect();

    if (this.activeSessionRef.current) {
      try { this.activeSessionRef.current.cancel(); } catch {}
      this.activeSessionRef.current = null;
    } else if (this.ffmpegKit) {
      try { this.ffmpegKit.cancel(); } catch {}
    }

    if (this.activeTempUriRef.current) {
      const file = this.activeTempUriRef.current;
      this.activeTempUriRef.current = null;
      vfs.deleteAsync(file, { idempotent: true }).catch(() => {});
    }

    const files = [...this.tempFilesRef.current];
    this.tempFilesRef.current = [];
    files.forEach((file) => {
      vfs.deleteAsync(file, { idempotent: true }).catch(() => {});
    });
  }

  // Exact handleSave logic
  async handleSave() {
    const targetUri = this.filteredUriRef.current;
    if (this.isProcessing) return false;
    this.isSaving = true;
    try {
      this.savedUris.push(targetUri);
      return true;
    } finally {
      this.isSaving = false;
    }
  }

  // Exact handleShare logic
  async handleShare() {
    const targetUri = this.filteredUriRef.current;
    this.isSharing = true;
    try {
      this.sharedUris.push(targetUri);
      return true;
    } finally {
      this.isSharing = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEST SUITES EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

async function runEmpiricalStressSuite() {

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 1: Tier 1 Failure -> Tier 2 Fallback Execution
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\x1b[33m[Suite 1] Empirical Tier 1 -> Tier 2 Fallback Cascade\x1b[0m');
  {
    vfs.reset();
    resetFontCache();

    // Create safe font on Android
    const candidateFont = FONT_CANDIDATES.android[0];
    vfs.createFile(`file://${candidateFont}`, 50000);

    const kit = new MockFFmpegKit();
    kit.behavior.succeedTier1 = false; // Tier 1 fails! (Simulating FreeType / font crash)
    kit.behavior.succeedTier2 = true;  // Tier 2 succeeds!
    kit.behavior.delayMs = 15;

    const comp = new SimulatedVideoPreviewComponent({ ffmpegKit: kit });
    comp.mount();

    // Wait for full cascade to complete
    await new Promise((r) => setTimeout(r, 80));

    // Assertions
    assert(comp.filterApplied === true, 'TC-1.1: filterApplied is true after Tier 2 succeeds');
    assert(comp.isProcessing === false, 'TC-1.2: isProcessing is false after Tier 2 completes');
    assert(comp.filteredUri && comp.filteredUri.includes('retrocam_v_t2_'), 'TC-1.3: filteredUri points to Tier 2 generated file (retrocam_v_t2_*)');
    assert(comp.filteredUriRef.current === comp.filteredUri, 'TC-1.4: filteredUriRef points to Tier 2 output');
    assert(comp.fallbackNotice === 'Timestamp omitted due to system font compatibility.', 'TC-1.5: Notice correctly informs user timestamp was omitted');

    // Inspect FFmpeg execution args across the sessions
    assert(kit.sessions.length === 2, 'TC-1.6: Exactly two FFmpeg sessions executed (Tier 1 then Tier 2)');
    const t1Args = kit.sessions[0].args;
    const t2Args = kit.sessions[1].args;

    assert(t1Args.some(a => a.includes('drawtext=')), 'TC-1.7: Tier 1 included drawtext with candidate font');
    assert(!t2Args.some(a => a.includes('drawtext=')), 'TC-1.8: Tier 2 cleanly omitted drawtext filter');
    assert(t2Args.some(a => a.includes('colorlevels=')), 'TC-1.9: Tier 2 preserved color grading filters');

    // Storage verification: Tier 1 partial file was deleted, Tier 2 output exists
    assert(vfs.hasFile(comp.filteredUri), 'TC-1.10: Tier 2 output file exists in cache');
    const allCacheFiles = [...vfs.files.keys()].filter(k => k.includes('retrocam_v_t1_'));
    assert(allCacheFiles.length === 0, 'TC-1.11: Failed Tier 1 intermediate file was purged without leak');

    // User action verification
    await comp.handleSave();
    assert(comp.savedUris.length === 1 && comp.savedUris[0] === comp.filteredUri, 'TC-1.12: Save Video saves Tier 2 filtered video');

    await comp.handleShare();
    assert(comp.sharedUris.length === 1 && comp.sharedUris[0] === comp.filteredUri, 'TC-1.13: Share Video shares Tier 2 filtered video');

    // Subcase 1B: No safe font exists on system (null font)
    vfs.reset();
    resetFontCache(); // No font files in vfs
    const kitNoFont = new MockFFmpegKit();
    kitNoFont.behavior.succeedTier2 = true;
    kitNoFont.behavior.delayMs = 15;

    const compNoFont = new SimulatedVideoPreviewComponent({ ffmpegKit: kitNoFont });
    compNoFont.mount();
    await new Promise((r) => setTimeout(r, 60));

    assert(kitNoFont.sessions.length === 1, 'TC-1.14: Tier 1 is cleanly skipped when safeFont is null; only Tier 2 executes');
    assert(!kitNoFont.sessions[0].args.some(a => a.includes('drawtext=')), 'TC-1.15: Executed session has zero drawtext');
    assert(compNoFont.filterApplied === true, 'TC-1.16: Filter applied successfully via Tier 2');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 2: Tier 2 Failure -> Fallback to Tier 3 (Total Filter Failure)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n\x1b[33m[Suite 2] Empirical Tier 2 -> Tier 3 (Original Video Preservation)\x1b[0m');
  {
    vfs.reset();
    resetFontCache();

    // Create safe font
    vfs.createFile(`file://${FONT_CANDIDATES.android[0]}`, 50000);

    const kitFailBoth = new MockFFmpegKit();
    kitFailBoth.behavior.succeedTier1 = false; // Tier 1 fails
    kitFailBoth.behavior.succeedTier2 = false; // Tier 2 fails (e.g., OOM / codec error)
    kitFailBoth.behavior.delayMs = 15;

    const originalVideoUri = 'file:///data/user/0/com.retrocam/cache/Camera/raw_rec_ORIGINAL.mp4';
    vfs.createFile(originalVideoUri, 2048000); // 2MB original recorded video

    const compFailBoth = new SimulatedVideoPreviewComponent({
      uri: originalVideoUri,
      ffmpegKit: kitFailBoth,
    });

    compFailBoth.mount();
    await new Promise((r) => setTimeout(r, 80));

    // Assertions for Tier 3:
    assert(compFailBoth.isProcessing === false, 'TC-2.1: isProcessing is false after Tier 3 fallback');
    assert(compFailBoth.filterApplied === false, 'TC-2.2: filterApplied is false (indicates original video preview)');
    assert(compFailBoth.filteredUri === null, 'TC-2.3: filteredUri state is null');
    assert(compFailBoth.filteredUriRef.current === originalVideoUri, 'TC-2.4: filteredUriRef points strictly to original video URI');
    assert(compFailBoth.fallbackNotice === 'Video filter unavailable. Your original video is preserved.', 'TC-2.5: User receives clear non-blocking reassurance notice');
    assert(compFailBoth.player.currentSource === originalVideoUri, 'TC-2.6: Video player hot-swaps to original video source via player.replace');

    // Storage: verify zero orphaned transcode files exist in cache
    const cachedTranscodes = [...vfs.files.keys()].filter(k => k.includes('retrocam_v_t'));
    assert(cachedTranscodes.length === 0, 'TC-2.7: Both Tier 1 & Tier 2 failed outputs purged; zero disk leak');
    assert(vfs.hasFile(originalVideoUri), 'TC-2.8: Original video file remains intact and accessible in storage');

    // Anti-lockout user operations
    const saveResult = await compFailBoth.handleSave();
    assert(saveResult === true, 'TC-2.9: Save button functions normally without error');
    assert(compFailBoth.savedUris[0] === originalVideoUri, 'TC-2.10: Gallery receives original recorded video intact');

    const shareResult = await compFailBoth.handleShare();
    assert(shareResult === true, 'TC-2.11: Share button functions normally');
    assert(compFailBoth.sharedUris[0] === originalVideoUri, 'TC-2.12: Native share receives original recorded video');

    // Subcase 2B: Expo Go (FFmpegKit is null)
    const compExpoGo = new SimulatedVideoPreviewComponent({
      uri: originalVideoUri,
      ffmpegKit: null,
    });
    compExpoGo.mount();

    assert(compExpoGo.filteredUriRef.current === originalVideoUri, 'TC-2.13: In Expo Go, filteredUriRef immediately points to original video');
    assert(compExpoGo.isProcessing === false, 'TC-2.14: In Expo Go, isProcessing is immediately false');
    assert(compExpoGo.fallbackNotice.includes('Showing original video'), 'TC-2.15: Expo Go notice informs user original video is displayed');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 3: Unmount Safety & Concurrent Cancellation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n\x1b[33m[Suite 3] Unmount Lifecycle & Cancellation Safety\x1b[0m');
  {
    vfs.reset();
    resetFontCache();
    vfs.createFile(`file://${FONT_CANDIDATES.android[0]}`, 50000);

    // Case 3.1: Debounce cancellation (unmount before 20ms debounce)
    const kitDebounce = new MockFFmpegKit();
    kitDebounce.behavior.delayMs = 50;
    const compDebounce = new SimulatedVideoPreviewComponent({ ffmpegKit: kitDebounce });
    compDebounce.mount();
    compDebounce.unmount(); // Immediate unmount

    await new Promise((r) => setTimeout(r, 50));
    assert(kitDebounce.sessions.length === 0, 'TC-3.1: Debounce unmount clears timer before processVideo starts');
    assert(vfs.countFilesInCache() === 0, 'TC-3.2: Zero files created on early debounce unmount');

    // Case 3.2: Unmount during active Tier 1 transcode
    const kitT1Cancel = new MockFFmpegKit();
    kitT1Cancel.behavior.delayMs = 60; // Long enough to unmount mid-execution
    const compT1Cancel = new SimulatedVideoPreviewComponent({ ffmpegKit: kitT1Cancel });
    compT1Cancel.mount();

    // Wait until processVideo starts and launches session
    await new Promise((r) => setTimeout(r, 25));
    assert(compT1Cancel.activeSessionRef.current !== null, 'TC-3.3: Active session exists during Tier 1 encoding');

    const activeSession = compT1Cancel.activeSessionRef.current;
    const activeTempUri = compT1Cancel.activeTempUriRef.current;
    assert(activeTempUri && activeTempUri.includes('retrocam_v_t1_'), 'TC-3.4: In-flight temp URI tracked in activeTempUriRef');

    // Unmount while Tier 1 is running
    compT1Cancel.unmount();

    assert(activeSession.cancelled === true, 'TC-3.5: Session.cancel() invoked immediately on unmount');
    assert(compT1Cancel.isMounted.current === false, 'TC-3.6: isMounted set to false');
    assert(compT1Cancel.activeSessionRef.current === null, 'TC-3.7: activeSessionRef cleared to null');

    // Wait for async callback to complete
    await new Promise((r) => setTimeout(r, 60));

    // Verify it did NOT advance to Tier 2
    assert(kitT1Cancel.sessions.length === 1, 'TC-3.8: Cancelled session did NOT trigger Tier 2');
    assert(vfs.countFilesInCache() === 0, 'TC-3.9: In-flight temp file purged on unmount; cache empty');

    // Case 3.3: Unmount during Tier 2 transcode
    const kitT2Cancel = new MockFFmpegKit();
    kitT2Cancel.behavior.succeedTier1 = false;
    kitT2Cancel.behavior.delayMs = 30; // 30ms per tier
    const compT2Cancel = new SimulatedVideoPreviewComponent({ ffmpegKit: kitT2Cancel });
    compT2Cancel.mount();

    // Wait for Tier 1 to fail and Tier 2 to start (~20ms debounce + ~30ms T1 = 50ms, plus async ticks)
    await new Promise((r) => setTimeout(r, 70));
    assert(compT2Cancel.activeTempUriRef.current && compT2Cancel.activeTempUriRef.current.includes('retrocam_v_t2_'), 'TC-3.10: Tier 2 active temp URI tracked');

    // Unmount during Tier 2
    compT2Cancel.unmount();
    await new Promise((r) => setTimeout(r, 50));

    assert(compT2Cancel.fallbackNotice !== 'Video filter unavailable. Your original video is preserved.', 'TC-3.11: Unmount during Tier 2 did NOT trigger Tier 3 state transition');
    assert(vfs.countFilesInCache() === 0, 'TC-3.12: Tier 2 in-flight file purged cleanly');

    // Case 3.4: Master unmount cleanup after successful completion
    const kitSuccess = new MockFFmpegKit();
    kitSuccess.behavior.succeedTier1 = true;
    kitSuccess.behavior.delayMs = 10;
    const compSuccess = new SimulatedVideoPreviewComponent({ ffmpegKit: kitSuccess });
    compSuccess.mount();
    await new Promise((r) => setTimeout(r, 50));

    assert(compSuccess.tempFilesRef.current.length === 1, 'TC-3.13: Completed transcode recorded in tempFilesRef');
    assert(vfs.countFilesInCache() === 1, 'TC-3.14: Completed transcode file present in cache before unmount');

    compSuccess.unmount();
    assert(vfs.countFilesInCache() === 0, 'TC-3.15: Master unmount cleans up all accumulated temp files');

    // Case 3.5: Stress test: 50 Rapid sequential mount / unmount cycles
    let churnFailed = false;
    for (let i = 0; i < 50; i++) {
      const churnKit = new MockFFmpegKit();
      churnKit.behavior.delayMs = Math.floor(Math.random() * 20);
      const churnComp = new SimulatedVideoPreviewComponent({ ffmpegKit: churnKit });
      churnComp.mount();
      // Jitter unmount time between 0ms and 15ms
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 15)));
      churnComp.unmount();
    }
    await new Promise((r) => setTimeout(r, 60));
    assert(vfs.countFilesInCache() === 0, 'TC-3.16: Stress Test: 50 rapid mount/unmount cycles left zero leaked files');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 4: Progress Monotonicity & Real-Time Telemetry
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n\x1b[33m[Suite 4] Progress Calculation & Monotonicity Verification\x1b[0m');
  {
    vfs.reset();
    resetFontCache();
    vfs.createFile(`file://${FONT_CANDIDATES.android[0]}`, 50000);

    // Case 4.1: Normal PTS stream
    const kitProgress = new MockFFmpegKit();
    kitProgress.behavior.ptsStream = [0, 500, 1000, 2000, 3000, 4000, 4800, 5000];
    kitProgress.behavior.delayMs = 20;

    const compProgress = new SimulatedVideoPreviewComponent({ ffmpegKit: kitProgress });
    compProgress.mount();
    await new Promise((r) => setTimeout(r, 60));

    const hist = compProgress.dispatchedProgressHistory;
    assert(hist.length >= 3, 'TC-4.1: Multiple progress ticks recorded');
    assert(hist[0] >= 1, 'TC-4.2: First dispatched progress is >= 1%');
    assert(hist[hist.length - 1] === 100, 'TC-4.3: Final dispatched progress snaps to 100%');

    let strictlyMonotonic = true;
    for (let i = 1; i < hist.length; i++) {
      if (hist[i] <= hist[i - 1]) strictlyMonotonic = false;
    }
    assert(strictlyMonotonic, 'TC-4.4: Dispatched progress stream is strictly monotonic (increasing)');

    // Case 4.2: Adaptive duration overshoot (video actual PTS 12000ms > initial estimated 5000ms)
    const kitOvershoot = new MockFFmpegKit();
    kitOvershoot.behavior.ptsStream = [1000, 3000, 5000, 6500, 8000, 10000, 12000];
    kitOvershoot.behavior.delayMs = 20;

    const compOvershoot = new SimulatedVideoPreviewComponent({ ffmpegKit: kitOvershoot });
    compOvershoot.mount();
    await new Promise((r) => setTimeout(r, 60));

    const overHist = compOvershoot.dispatchedProgressHistory;
    const intermediatePcts = overHist.slice(0, -1);

    const maxIntermediate = Math.max(...intermediatePcts);
    assert(maxIntermediate <= 95, `TC-4.5: Intermediate progress never exceeded 95% under duration overshoot (max: ${maxIntermediate}%)`);

    let overshootMonotonic = true;
    for (let i = 1; i < overHist.length; i++) {
      if (overHist[i] <= overHist[i - 1]) overshootMonotonic = false;
    }
    assert(overshootMonotonic, 'TC-4.6: Overshoot progress stream remains strictly monotonic without retrograde jump');
    assert(overHist[overHist.length - 1] === 100, 'TC-4.7: Snaps to 100% on completion');

    // Case 4.3: Out-of-order PTS timestamps (simulating encoder B-frame out-of-order stats)
    const kitErratic = new MockFFmpegKit();
    kitErratic.behavior.ptsStream = [1000, 2000, 1500, 3000, 2500, 4000];
    kitErratic.behavior.delayMs = 20;

    const compErratic = new SimulatedVideoPreviewComponent({ ffmpegKit: kitErratic });
    compErratic.mount();
    await new Promise((r) => setTimeout(r, 60));

    const erraticHist = compErratic.dispatchedProgressHistory;
    let erraticMonotonic = true;
    for (let i = 1; i < erraticHist.length; i++) {
      if (erraticHist[i] <= erraticHist[i - 1]) erraticMonotonic = false;
    }
    assert(erraticMonotonic, 'TC-4.8: Erratic out-of-order PTS timestamps cleanly filtered by throttling check');

    // Case 4.4: Telemetry contents
    assert(compProgress.transcodeStats !== null, 'TC-4.9: Transcode telemetry stats populated');
    assert(typeof compProgress.transcodeStats.timeMs === 'number', 'TC-4.10: Telemetry timeMs is numeric');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 5: Video Preservation Invariant Across All Failure Permutations
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n\x1b[33m[Suite 5] Video Preservation Invariant & Anti-Lockout Verification\x1b[0m');
  {
    const originalVideoPath = 'file:///data/user/0/com.retrocam/cache/Camera/USER_RECORDING.mp4';
    vfs.reset();
    vfs.createFile(originalVideoPath, 5000000); // 5MB video

    // Permutation Matrix:
    // 1: Tier 1 Pass
    // 2: Tier 1 Fail -> Tier 2 Pass
    // 3: Tier 1 Fail -> Tier 2 Fail -> Tier 3
    // 4: Expo Go (No FFmpeg)

    const permutations = [
      { name: 'Tier 1 Success', s1: true, s2: true, hasKit: true },
      { name: 'Tier 1 Fail -> Tier 2 Success', s1: false, s2: true, hasKit: true },
      { name: 'Tier 1 Fail -> Tier 2 Fail (Tier 3)', s1: false, s2: false, hasKit: true },
      { name: 'Expo Go Environment', s1: false, s2: false, hasKit: false },
    ];

    let idx = 1;
    for (const perm of permutations) {
      const kit = perm.hasKit ? new MockFFmpegKit() : null;
      if (kit) {
        kit.behavior.succeedTier1 = perm.s1;
        kit.behavior.succeedTier2 = perm.s2;
        kit.behavior.delayMs = 10;
      }

      const comp = new SimulatedVideoPreviewComponent({
        uri: originalVideoPath,
        ffmpegKit: kit,
      });

      comp.mount();
      await new Promise((r) => setTimeout(r, 60));

      // Invariant 1: Original video file is NEVER modified or deleted
      assert(vfs.hasFile(originalVideoPath), `TC-5.${idx++}: [${perm.name}] Original video file strictly exists on disk`);

      // Invariant 2: filteredUriRef is a valid, non-empty URI
      assert(Boolean(comp.filteredUriRef.current), `TC-5.${idx++}: [${perm.name}] filteredUriRef.current is defined and non-empty`);

      // Invariant 3: Save succeeds without throwing
      const saved = await comp.handleSave();
      assert(saved === true && comp.savedUris.length > 0, `TC-5.${idx++}: [${perm.name}] Save operation succeeds`);

      // Invariant 4: Share succeeds without throwing
      const shared = await comp.handleShare();
      assert(shared === true && comp.sharedUris.length > 0, `TC-5.${idx++}: [${perm.name}] Share operation succeeds`);

      // Invariant 5: Player is not in an invalid state
      assert(Boolean(comp.player.currentSource), `TC-5.${idx++}: [${perm.name}] Player has valid video source to play`);

      comp.unmount();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n\x1b[36m======================================================================\x1b[0m');
  console.log(`   Simulation Results: \x1b[32m${passedTests} Passed\x1b[0m, \x1b[31m${failedTests} Failed\x1b[0m`);
  console.log('\x1b[36m======================================================================\x1b[0m\n');

  if (failedTests > 0) {
    console.error('Failed Test Details:');
    failureDetails.forEach((f) => console.error(`  - ${f.testName}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ ALL EMPIRICAL CHALLENGER TESTS PASSED WITH ZERO FAILURES.\x1b[0m\n');
    process.exit(0);
  }
}

runEmpiricalStressSuite().catch((err) => {
  console.error('Uncaught error during test suite execution:', err);
  process.exit(1);
});
