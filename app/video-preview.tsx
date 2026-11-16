import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { X, Download, Share2, AlertTriangle, Lock, Zap } from 'lucide-react-native';
import { CAMERA_PRESETS, CameraPreset } from '@/constants/presets';
import { isPresetLocked } from '@/utils/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { buildFFmpegArgs, resolveSafeFontPath, VideoEffectMode } from '@/utils/videoFilter';
import { useDevice } from '@/hooks/useDevice';

// FFmpeg setup
let FFmpegKit: any = null;
let ReturnCode: any = null;
try {
  const ffmpegModule = require('ffmpeg-kit-react-native');
  FFmpegKit = ffmpegModule.FFmpegKit;
  ReturnCode = ffmpegModule.ReturnCode;
} catch (e) {
  console.log('[RetroCam] FFmpeg not available (Expo Go)');
}

// Helper to get raw path for FFmpeg
const getSafePath = (uri: string) => {
  if (!uri) return '';
  let rawUri = Array.isArray(uri) ? uri[0] : uri;
  try {
    rawUri = decodeURIComponent(rawUri);
  } catch {
    // Keep as-is if already decoded or contains raw %
  }
  return rawUri.replace(/^file:\/\//, '');
};

interface TranscodeStats {
  frames: number;
  fps: number;
  timeMs: number;
  speed: number;
}

export default function VideoPreviewScreen() {
  const { uri: encodedUri, presetId, videoEffect } = useLocalSearchParams<{
    uri: string;
    presetId: string;
    videoEffect?: VideoEffectMode;
  }>();
  const uri = useMemo(() => {
    try {
      return decodeURIComponent(encodedUri || '');
    } catch {
      return encodedUri || '';
    }
  }, [encodedUri]);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isTablet, scale: uiScale } = useDevice();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('DEVELOPING CASSETTE...');
  const [transcodeStats, setTranscodeStats] = useState<TranscodeStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [filteredUri, setFilteredUri] = useState<string | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const { isPro, showPaywall } = usePurchases();

  const isMounted = useRef(true);
  const activeSessionRef = useRef<any>(null);
  const activeTempUriRef = useRef<string | null>(null);
  const tempFilesRef = useRef<string[]>([]);
  const filteredUriRef = useRef<string>(uri);

  const initialPreset = useMemo(
    () => CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0],
    [presetId]
  );
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>(initialPreset);
  const preset = currentPreset;
  const isLocked = isPresetLocked(preset, isPro);

  const initialEffect: VideoEffectMode = useMemo(() => {
    const eff = Array.isArray(videoEffect) ? videoEffect[0] : videoEffect;
    if (eff === 'vhs' || eff === 'glitch' || eff === 'rgb') return eff;
    return 'none';
  }, [videoEffect]);
  const [activeEffect, setActiveEffect] = useState<VideoEffectMode>(initialEffect);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const displayedPresets = useMemo(() => {
    if (filterCategory === 'all') return CAMERA_PRESETS;
    if (filterCategory === 'bw') {
      return CAMERA_PRESETS.filter(p => p.settings.saturation === 0);
    }
    if (filterCategory === 'vhs') {
      return CAMERA_PRESETS.filter(p => p.cameraType === 'vhs' || p.cameraType === 'camcorder' || p.pack === 'vhs');
    }
    if (filterCategory === 'cine') {
      return CAMERA_PRESETS.filter(p => p.cameraType === '8mm' || p.cameraType === '16mm' || p.pack === 'cine');
    }
    return CAMERA_PRESETS.filter(p => p.cameraType === filterCategory || p.pack === filterCategory);
  }, [filterCategory]);

  const handleSelectPreset = useCallback((p: CameraPreset) => {
    if (isPresetLocked(p, isPro)) {
      showPaywall(p.id);
      return;
    }
    setCurrentPreset(p);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPro, showPaywall]);

  const cycleEffect = useCallback(() => {
    const effects: VideoEffectMode[] = ['none', 'vhs', 'glitch', 'rgb'];
    setActiveEffect((prev) => {
      const idx = effects.indexOf(prev);
      return effects[(idx + 1) % effects.length];
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Player initialization & hot-swap
  const player = useVideoPlayer(filteredUri || uri, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (player && filteredUri && filteredUri !== uri) {
      player.replace(filteredUri);
    }
  }, [filteredUri]);

  // Master unmount cleanup: cancel any active native session and remove all temp files
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (activeSessionRef.current) {
        try {
          activeSessionRef.current.cancel();
        } catch {
          // Ignore
        }
        activeSessionRef.current = null;
      } else if (FFmpegKit) {
        try {
          FFmpegKit.cancel();
        } catch {
          // Ignore
        }
      }

      if (activeTempUriRef.current) {
        const file = activeTempUriRef.current;
        activeTempUriRef.current = null;
        FileSystem.deleteAsync(file, { idempotent: true }).catch(() => {});
      }

      const files = [...tempFilesRef.current];
      tempFilesRef.current = [];
      files.forEach((file) => {
        FileSystem.deleteAsync(file, { idempotent: true }).catch(() => {});
      });
    };
  }, []);

  // Async FFmpeg executor with real-time statistics callback
  const runFFmpegAsync = useCallback(
    (
      args: string[],
      estimatedDurationMs: number,
      onProgress: (pct: number, stats: TranscodeStats) => void
    ): Promise<{ success: boolean; session?: any; logs?: string }> => {
      return new Promise(async (resolve) => {
        if (!FFmpegKit) {
          resolve({ success: false, logs: 'FFmpegKit not available' });
          return;
        }
        try {
          let estDuration = Math.max(1000, estimatedDurationMs);
          let lastReportedPct = 0;

          const session = await FFmpegKit.executeWithArgumentsAsync(
            args,
            async (completedSession: any) => {
              activeSessionRef.current = null;
              const returnCode = await completedSession.getReturnCode();
              const success = ReturnCode ? ReturnCode.isSuccess(returnCode) : false;
              let logs = '';
              if (success) {
                onProgress(100, { frames: 0, fps: 0, timeMs: estDuration, speed: 1 });
              } else {
                const sessionLogs = await completedSession.getLogs();
                logs = sessionLogs?.slice(-10).map((l: any) => l.getMessage()).join('\n') || 'Unknown error';
              }
              resolve({ success, session: completedSession, logs });
            },
            () => {
              // Log callback (quiet)
            },
            (statistics: any) => {
              if (!statistics || !isMounted.current) return;
              const timeMs = statistics.getTime();
              if (timeMs <= 0) return;

              // Dynamically expand estimated duration if transcode exceeds estimate
              if (timeMs > estDuration) {
                estDuration = Math.round(timeMs * 1.25);
              }

              const rawPct = Math.round((timeMs / estDuration) * 100);
              const pct = Math.min(95, Math.max(1, rawPct));

              // Throttle state dispatches: update only when integer percentage advances
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
          activeSessionRef.current = session;
        } catch (err: any) {
          activeSessionRef.current = null;
          resolve({ success: false, logs: err?.message || 'Execution error' });
        }
      });
    },
    []
  );

  // 3-Tier Fallback Cascade Processing
  useEffect(() => {
    if (!uri) return;

    // In Expo Go or non-FFmpeg environments, gracefully fallback to original video
    if (!FFmpegKit) {
      filteredUriRef.current = uri;
      setFilteredUri(null);
      setFilterApplied(false);
      setIsProcessing(false);
      setFallbackNotice('Video filter unavailable in this environment. Showing original video.');
      return;
    }

    let active = true;

    const processVideo = async () => {
      if (!active || !isMounted.current) return;
      setIsProcessing(true);
      setProgress(0);
      setFallbackNotice(null);
      setProcessingStep('LOADING FILM PROFILE...');

      let rawInputPath = getSafePath(uri);
      const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';

      // If Android content:// URI or special scheme, copy to cache file first so FFmpeg can read it
      if (uri.startsWith('content://')) {
        try {
          const cachedInputUri = `${cacheDir}retrocam_input_${Date.now()}.mp4`;
          await FileSystem.copyAsync({ from: uri, to: cachedInputUri });
          tempFilesRef.current.push(cachedInputUri);
          rawInputPath = getSafePath(cachedInputUri);
        } catch (copyErr) {
          console.warn('[RetroCam] Could not copy content:// URI:', copyErr);
        }
      }

      if (activeTempUriRef.current) {
        await FileSystem.deleteAsync(activeTempUriRef.current, { idempotent: true }).catch(() => {});
        activeTempUriRef.current = null;
      }

      // Duration estimate in ms (default to 10s if duration not yet reported)
      const estimatedDurationMs = Math.round(
        ((player?.duration && player.duration > 0 ? player.duration : 0) || 10) * 1000
      );

      const onProgress = (pct: number, stats: TranscodeStats) => {
        if (!active || !isMounted.current) return;
        setProgress(pct);
        setTranscodeStats(stats);
        if (pct < 15) setProcessingStep('LOADING FILM PROFILE...');
        else if (pct < 65) setProcessingStep('DEVELOPING GRAIN & COLOR...');
        else if (pct < 95) setProcessingStep('ENCODING AUDIO & VIDEO...');
        else setProcessingStep('FINALIZING CASSETTE...');
      };

      // Probe for safe system font
      let safeFont: string | null = null;
      try {
        safeFont = await resolveSafeFontPath();
      } catch {
        safeFont = null;
      }

      const dateStr = preset.settings.timestamp ? (preset.settings.retroDate || undefined) : undefined;

      // ─────────────────────────────────────────────
      // TIER 1: Full Filter + Timestamp & Safe Font
      // ─────────────────────────────────────────────
      let tier1Success = false;
      const canAttemptTier1 = Boolean(preset.settings.timestamp && safeFont);

      if (canAttemptTier1) {
        const outUriT1 = `${cacheDir}retrocam_v_t1_${Date.now()}.mp4`;
        activeTempUriRef.current = outUriT1;

        try {
          const argsT1 = buildFFmpegArgs(rawInputPath, getSafePath(outUriT1), preset.settings, dateStr, safeFont, undefined, activeEffect);
          const resultT1 = await runFFmpegAsync(argsT1, estimatedDurationMs, onProgress);

          if (active && isMounted.current && resultT1.success) {
            const fileInfo = await FileSystem.getInfoAsync(outUriT1);
            if (fileInfo.exists && (fileInfo as any).size > 0) {
              tempFilesRef.current.push(outUriT1);
              filteredUriRef.current = outUriT1;
              setFilteredUri(outUriT1);
              setFilterApplied(true);
              activeTempUriRef.current = null;
              tier1Success = true;
            }
          }
        } catch (e) {
          console.warn('[RetroCam] Tier 1 failed:', e);
        }

        if (!tier1Success && activeTempUriRef.current === outUriT1) {
          await FileSystem.deleteAsync(outUriT1, { idempotent: true }).catch(() => {});
          activeTempUriRef.current = null;
        }
      }

      if (tier1Success || !active || !isMounted.current) {
        if (active && isMounted.current) setIsProcessing(false);
        return;
      }

      // ─────────────────────────────────────────────
      // TIER 2: Full Filter WITHOUT Timestamp (fontFile = null)
      // ─────────────────────────────────────────────
      console.log('[RetroCam] Attempting Tier 2 (Filter without timestamp)...');
      if (active && isMounted.current) {
        setProcessingStep('COMPATIBILITY DEVELOPING (NO TEXT)...');
        setProgress(10);
      }

      let tier2Success = false;
      const outUriT2 = `${cacheDir}retrocam_v_t2_${Date.now()}.mp4`;
      activeTempUriRef.current = outUriT2;

      try {
        const argsT2 = buildFFmpegArgs(rawInputPath, getSafePath(outUriT2), preset.settings, dateStr, null, undefined, activeEffect);
        const resultT2 = await runFFmpegAsync(argsT2, estimatedDurationMs, onProgress);

        if (active && isMounted.current && resultT2.success) {
          const fileInfo = await FileSystem.getInfoAsync(outUriT2);
          if (fileInfo.exists && (fileInfo as any).size > 0) {
            tempFilesRef.current.push(outUriT2);
            filteredUriRef.current = outUriT2;
            setFilteredUri(outUriT2);
            setFilterApplied(true);
            activeTempUriRef.current = null;
            tier2Success = true;
            if (preset.settings.timestamp) {
              setFallbackNotice('Timestamp omitted due to system font compatibility.');
            }
          }
        }
      } catch (e) {
        console.warn('[RetroCam] Tier 2 failed:', e);
      }

      if (!tier2Success && activeTempUriRef.current === outUriT2) {
        await FileSystem.deleteAsync(outUriT2, { idempotent: true }).catch(() => {});
        activeTempUriRef.current = null;
      }

      if (tier2Success || !active || !isMounted.current) {
        if (active && isMounted.current) setIsProcessing(false);
        return;
      }

      // ─────────────────────────────────────────────
      // TIER 3: Safe Fallback to Original Video URI
      // ─────────────────────────────────────────────
      console.warn('[RetroCam] Tier 2 failed. Falling back to Tier 3 (original video).');
      if (active && isMounted.current) {
        filteredUriRef.current = uri;
        setFilteredUri(null);
        setFilterApplied(false);
        setIsProcessing(false);
        setFallbackNotice('Video filter unavailable. Your original video is preserved.');
        if (player) {
          player.replace(uri);
        }
      }
    };

    const t = setTimeout(processVideo, 300);

    return () => {
      active = false;
      clearTimeout(t);
      if (activeSessionRef.current) {
        try {
          activeSessionRef.current.cancel();
        } catch {
          // Ignore
        }
        activeSessionRef.current = null;
      }
      if (activeTempUriRef.current) {
        const file = activeTempUriRef.current;
        activeTempUriRef.current = null;
        FileSystem.deleteAsync(file, { idempotent: true }).catch(() => {});
      }
    };
  }, [uri, preset, activeEffect]);

  const handleSave = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    const targetUri = filteredUriRef.current;
    if (isProcessing) return;

    setIsSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(targetUri);
        if (isMounted.current) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Video saved to gallery');
        }
      } else {
        if (isMounted.current && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(targetUri);
        }
      }
    } catch (err) {
      if (isMounted.current) Alert.alert('Error', 'Failed to save video.');
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [isLocked, preset.id, showPaywall, isProcessing]);

  const handleShare = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    const targetUri = filteredUriRef.current;
    setIsSharing(true);
    try {
      if (isMounted.current && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(targetUri);
      }
    } catch (err) {
      // noop
    } finally {
      if (isMounted.current) setIsSharing(false);
    }
  }, [isLocked, preset.id, showPaywall]);

  const VIDEO_HEIGHT = isTablet ? SCREEN_HEIGHT * 0.52 : SCREEN_HEIGHT * 0.52;
  const effectLabel: Record<VideoEffectMode, string> = {
    none: 'CLEAN',
    vhs: 'VHS',
    glitch: 'GLITCH',
    rgb: 'RGB',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isTablet ? 32 : 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}
        >
          <X size={22 * uiScale} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.presetName, { fontSize: 16 * uiScale }]}>{preset.name}</Text>
          <Text style={[styles.statusSub, { fontSize: 10 * uiScale }]}>
            {isProcessing ? 'DEVELOPING...' : filterApplied ? 'FILTER APPLIED' : 'LIVE SIMULATION PREVIEW'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={cycleEffect}
          style={[
            styles.effectBtn,
            activeEffect !== 'none' && styles.effectBtnActive,
            { height: 36 * uiScale, paddingHorizontal: 10 * uiScale, borderRadius: 18 * uiScale },
          ]}
        >
          <Zap size={14 * uiScale} color={activeEffect !== 'none' ? '#000' : '#FFB800'} />
          <Text
            style={[
              styles.effectBtnText,
              activeEffect !== 'none' && styles.effectBtnTextActive,
              { fontSize: 10 * uiScale },
            ]}
          >
            {effectLabel[activeEffect]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video View */}
      <View
        style={[
          styles.videoContainer,
          {
            height: VIDEO_HEIGHT,
            width: isTablet ? Math.min(SCREEN_WIDTH - 64, 800) : '100%',
            alignSelf: 'center',
            borderRadius: isTablet ? 16 : 0,
            overflow: 'hidden',
          },
        ]}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Retro Transcoding Progress Overlay */}
        {isProcessing && (
          <View style={styles.overlay}>
            {/* Retro Status Badge */}
            <View style={styles.retroBadge}>
              <View style={styles.blinkingRecDot} />
              <Text style={styles.retroBadgeText}>DEVELOPING CASSETTE</Text>
            </View>

            {/* Large Monospace Percentage */}
            <Text style={[styles.progressPercentage, { fontSize: 36 * uiScale }]}>
              {progress}%
            </Text>

            {/* Retro Segmented Progress Bar */}
            <View style={[styles.progressTrack, { width: 240 * uiScale }]}>
              <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, progress))}%` }]} />
            </View>

            {/* Dynamic Status Text */}
            <Text style={[styles.stepText, { fontSize: 13 * uiScale }]}>
              {processingStep}
            </Text>

            {/* Subtle Telemetry Footer */}
            {transcodeStats && transcodeStats.frames > 0 && (
              <Text style={[styles.telemetryText, { fontSize: 10 * uiScale }]}>
                FRAME {transcodeStats.frames} • {transcodeStats.fps.toFixed(0)} FPS • {transcodeStats.speed.toFixed(1)}x
              </Text>
            )}
          </View>
        )}

        {/* Real-time overlay preview (if not yet processed) */}
        {!filterApplied && !isProcessing && preset.settings.tintOpacity > 0 && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: preset.settings.tint, opacity: preset.settings.tintOpacity * 0.5 },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Live VHS / Camcorder / RGB Frame Overlays */}
        {(activeEffect === 'vhs' || activeEffect === 'glitch' || preset.cameraType === 'vhs' || preset.cameraType === 'camcorder') && (
          <View style={[StyleSheet.absoluteFillObject, styles.liveVhsLines]} pointerEvents="none">
            <View style={styles.liveVhsTrackingBar} />
          </View>
        )}
        {(activeEffect === 'rgb' || activeEffect === 'glitch' || preset.settings.rgbShift > 0.02) && !filterApplied && (
          <>
            <View style={[styles.liveRgbBorder, { borderColor: 'rgba(255,60,40,0.28)', transform: [{ translateX: -3 }] }]} pointerEvents="none" />
            <View style={[styles.liveRgbBorder, { borderColor: 'rgba(40,140,255,0.28)', transform: [{ translateX: 3 }] }]} pointerEvents="none" />
          </>
        )}
        {preset.settings.timestamp && !filterApplied && (
          <Text style={styles.liveTimestamp} pointerEvents="none">
            {preset.settings.retroDate || "01/24/'94"}
          </Text>
        )}

        {/* Non-blocking Fallback Notice Banner */}
        {fallbackNotice && !isProcessing && (
          <View style={styles.fallbackNoticeBanner}>
            <AlertTriangle size={16 * uiScale} color="#FFB800" />
            <Text style={[styles.fallbackNoticeText, { fontSize: 12 * uiScale }]}>
              {fallbackNotice}
            </Text>
          </View>
        )}
      </View>

      {/* Actions & Filter Carousel */}
      <ScrollView style={styles.bottomScroll} contentContainerStyle={[styles.bottomContent, { paddingHorizontal: isTablet ? 32 : 20 }]}>
        {/* Live Filter & Camera Switcher Carousel */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Text style={[styles.filterSectionTitle, { fontSize: 11 * uiScale }]}>FILTERS & FILM STOCKS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsRow}
            >
              {[
                { id: 'all', label: 'ALL' },
                { id: 'vhs', label: 'VHS' },
                { id: 'cine', label: 'CINE' },
                { id: '35mm', label: '35mm' },
                { id: 'instant', label: 'INSTANT' },
                { id: 'digital-y2k', label: 'DIGITAL' },
                { id: 'bw', label: 'B&W' },
              ].map(cat => {
                const active = filterCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catTab, active && styles.catTabActive]}
                    onPress={() => {
                      setFilterCategory(cat.id);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.catTabText, active && styles.catTabTextActive, { fontSize: 10 * uiScale }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filterListContent, { gap: 10 * uiScale }]}
          >
            {displayedPresets.map((p) => {
              const isSelected = p.id === preset.id;
              const locked = isPresetLocked(p, isPro);
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPreset(p)}
                  style={[
                    styles.filterCard,
                    isSelected && styles.filterCardSelected,
                    { width: 82 * uiScale, paddingVertical: 8 * uiScale, paddingHorizontal: 6 * uiScale }
                  ]}
                >
                  <View style={[styles.filterPreviewSwatch, { backgroundColor: '#1E1E22', borderColor: p.color }]}>
                    <View style={[styles.filterSwatchTint, { backgroundColor: p.color, opacity: 0.35 }]} />
                    <Text style={[styles.filterSwatchTag, { fontSize: 9 * uiScale }]}>
                      {p.cameraType.toUpperCase()}
                    </Text>
                    {locked && (
                      <View style={styles.filterLockBadge}>
                        <Lock size={10 * uiScale} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.filterName,
                      isSelected && styles.filterNameSelected,
                      { fontSize: 10 * uiScale }
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
          <Text style={[styles.presetInfo, { fontSize: 13 * uiScale }]}>
            Using {preset.name} filter ({preset.cameraType}) {activeEffect !== 'none' ? `• ${effectLabel[activeEffect]} FX` : ''}
          </Text>
        </View>

        <View style={[styles.actions, { gap: isTablet ? 24 : 12 }]}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              (isProcessing || isSharing || isLocked) && styles.btnDisabled,
              { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale },
            ]}
            onPress={handleShare}
            disabled={isProcessing || isSharing || isLocked}
          >
            {isSharing ? <ActivityIndicator color="#FFF" /> : <Share2 size={20 * uiScale} color="#FFF" />}
            <Text style={[styles.actionBtnText, { fontSize: 15 * uiScale }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnPrimary,
              (isProcessing || isSaving || isLocked) && styles.btnDisabled,
              { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale },
            ]}
            onPress={handleSave}
            disabled={isProcessing || isSaving || isLocked}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Download size={20 * uiScale} color="#000" />
                <Text style={[styles.actionBtnText, { color: '#000', fontSize: 15 * uiScale }]}>Save Video</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {!isPro && (
          <View style={styles.proHint}>
            <Text style={[styles.proHintText, { fontSize: 10 * uiScale }]}>
              Upgrade to Pro to remove watermark and access cinematic 4K exports.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  presetName: { color: '#FFF', fontWeight: '800', letterSpacing: 0.5 },
  statusSub: { color: '#FFB800', fontWeight: '700', marginTop: 2 },
  effectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  effectBtnActive: {
    backgroundColor: '#FFB800',
    borderColor: '#FFB800',
  },
  effectBtnText: {
    color: '#FFB800',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  effectBtnTextActive: {
    color: '#000',
  },

  videoContainer: {
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  liveVhsLines: {
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  liveVhsTrackingBar: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  liveRgbBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
  },
  liveTimestamp: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    color: 'rgba(255, 180, 50, 0.92)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  retroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  blinkingRecDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  retroBadgeText: {
    color: '#FFB800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  progressPercentage: {
    color: '#FFB800',
    fontWeight: '900',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1.5,
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
    overflow: 'hidden',
    padding: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    borderRadius: 3,
  },
  stepText: {
    color: '#FFF',
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  telemetryText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1,
  },
  fallbackNoticeBanner: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  fallbackNoticeText: {
    color: '#FFB800',
    flex: 1,
    fontWeight: '500',
  },

  bottomScroll: { flex: 1 },
  bottomContent: { paddingTop: 10, paddingBottom: 20 },

  filterSection: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  filterSectionTitle: {
    color: '#FFB800',
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  categoryTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  catTabActive: {
    backgroundColor: '#FFB800',
  },
  catTabText: {
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catTabTextActive: {
    color: '#000',
  },
  filterListContent: {
    paddingRight: 16,
  },
  filterCard: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#161618',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterCardSelected: {
    borderColor: '#FFB800',
    backgroundColor: '#201A0E',
  },
  filterPreviewSwatch: {
    width: '100%',
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 5,
  },
  filterSwatchTint: {
    ...StyleSheet.absoluteFillObject,
  },
  filterSwatchTag: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterLockBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    padding: 2,
  },
  filterName: {
    color: '#D1D1D6',
    fontWeight: '700',
    textAlign: 'center',
  },
  filterNameSelected: {
    color: '#FFB800',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    opacity: 0.7,
  },
  presetDot: { width: 8, height: 8, borderRadius: 4 },
  presetInfo: { color: '#FFF', fontWeight: '500' },

  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnPrimary: { backgroundColor: '#FFB800' },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionBtnText: { color: '#FFF', fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },

  proHint: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,184,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.1)',
  },
  proHintText: { color: 'rgba(255,184,0,0.6)', textAlign: 'center', lineHeight: 16 },
});
