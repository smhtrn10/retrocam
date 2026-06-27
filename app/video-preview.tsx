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
import { X, Download, Share2, Info } from 'lucide-react-native';
import { CAMERA_PRESETS } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { buildFFmpegArgs } from '@/utils/videoFilter';
import { useDevice } from '@/hooks/useDevice';
import {
  Canvas,
  Rect,
  RoundedRect,
  Circle,
  RadialGradient,
  LinearGradient as SkiaLinearGradient,
  Turbulence,
  useCanvasRef,
  ImageFormat,
} from '@shopify/react-native-skia';

function getSeedFromUri(uri: string): number {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = uri.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

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
  const rawUri = decodeURIComponent(Array.isArray(uri) ? uri[0] : uri);
  return rawUri.replace(/^file:\/\//, '');
};


export default function VideoPreviewScreen() {
  const { uri: encodedUri, presetId } = useLocalSearchParams<{ uri: string; presetId: string }>();
  const uri = useMemo(() => decodeURIComponent(encodedUri), [encodedUri]);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isTablet, scale: uiScale } = useDevice();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [filteredUri, setFilteredUri] = useState<string | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPro, showPaywall } = usePurchases();
  
  const isMounted = useRef(true);
  const tempFilesRef = useRef<string[]>([]);
  const filteredUriRef = useRef<string>(uri);
  const canvasRef = useCanvasRef();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const preset = useMemo(
    () => CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0],
    [presetId]
  );

  const canvasWidth = 1080;
  const canvasHeight = 1920;

  const dustParticles = useMemo(() => {
    if (preset.settings.dust <= 0) return [];
    const seed = getSeedFromUri(uri);
    const rand = seededRandom(seed);
    return Array.from({ length: Math.floor(preset.settings.dust * 20) }, () => ({
      x: rand() * canvasWidth,
      y: rand() * canvasHeight,
      size: rand() * 6 + 2,
      opacity: rand() * 0.4 + 0.15,
    }));
  }, [preset.settings.dust, uri]);

  const scratches = useMemo(() => {
    if (preset.settings.dust <= 0.2) return [];
    const seed = getSeedFromUri(uri);
    const rand = seededRandom(seed + 1);
    return Array.from({ length: Math.floor(preset.settings.dust * 4) }, () => ({
      x: rand() * canvasWidth,
      top: rand() * canvasHeight * 0.4,
      h: rand() * canvasHeight * 0.3 + canvasHeight * 0.1,
      opacity: rand() * 0.2 + 0.06,
    }));
  }, [preset.settings.dust, uri]);

  const leakParams = useMemo(() => {
    if (preset.settings.lightLeak <= 0) return null;
    const seed = getSeedFromUri(uri);
    const rand = seededRandom(seed);
    const leakType = Math.floor(rand() * 4);
    
    let startFX = 0, startFY = 0, endFX = 0.7, endFY = 0.55;
    let colors = [`rgba(255,100,50,${preset.settings.lightLeak * 0.6})`, 'transparent'];
    
    if (leakType === 1) {
      startFX = 1; startFY = 0; endFX = 0.3; endFY = 0.6;
      colors = [`rgba(255,50,150,${preset.settings.lightLeak * 0.6})`, 'transparent'];
    } else if (leakType === 2) {
      startFX = 0; startFY = 1; endFX = 0.6; endFY = 0.4;
      colors = [`rgba(255,180,30,${preset.settings.lightLeak * 0.6})`, 'transparent'];
    } else if (leakType === 3) {
      startFX = 1; startFY = 1; endFX = 0.4; endFY = 0.5;
      colors = [`rgba(230,30,30,${preset.settings.lightLeak * 0.6})`, 'transparent'];
    }
    return { startFX, startFY, endFX, endFY, colors };
  }, [preset.settings.lightLeak, uri]);

  const sprocketHoles = (side: 'left' | 'right', sw: number) => {
    const sx = side === 'left' ? 0 : canvasWidth - sw;
    return Array.from({ length: 10 }).map((_, i) => (
      <RoundedRect
        key={`sp_${side}_${i}`}
        x={sx + 8}
        y={i * (canvasHeight / 10) + 8}
        width={sw - 16}
        height={canvasHeight / 10 - 16}
        r={6}
        color="#080808"
      />
    ));
  };

  // Apply filter automatically on mount
  useEffect(() => {
    if (!FFmpegKit || !uri) return;
    
    let active = true;
    const process = async () => {
      setIsProcessing(true);
      setError(null);
      
      const rawInputPath = getSafePath(uri);
      const fileName = `retrocam_v_${Date.now()}.mp4`;
      const outputUri = (FileSystem.documentDirectory ?? '') + fileName;
      const rawOutputPath = getSafePath(outputUri);

      try {
        let overlayPath = undefined;
        if (canvasRef.current) {
          const snapshot = await canvasRef.current.makeImageSnapshotAsync();
          if (snapshot) {
            const base64 = snapshot.encodeToBase64(ImageFormat.PNG, 100);
            const overlayFileName = `retrocam_ov_${Date.now()}.png`;
            const overlayUri = (FileSystem.documentDirectory ?? '') + overlayFileName;
            await FileSystem.writeAsStringAsync(overlayUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            overlayPath = getSafePath(overlayUri);
            tempFilesRef.current.push(overlayUri);
          }
        }

        const args = buildFFmpegArgs(rawInputPath, rawOutputPath, preset.settings, overlayPath);
        const session = await FFmpegKit.executeWithArguments(args);
        const returnCode = await session.getReturnCode();

        if (active && isMounted.current) {
          if (ReturnCode && ReturnCode.isSuccess(returnCode)) {
            tempFilesRef.current.push(outputUri);
            filteredUriRef.current = outputUri;
            setFilteredUri(outputUri);
            setFilterApplied(true);
          } else {
            const logs = await session.getLogs();
            const lastLogs = logs?.slice(-10).map((l: any) => l.getMessage()).join('\n') || 'Unknown error';
            setError(`FFmpeg Error: ${lastLogs}`);
            console.error('[RetroCam] FFmpeg failed:', lastLogs);
          }
        }
      } catch (err: any) {
        if (active && isMounted.current) {
          setError(err.message || 'Processing failed');
        }
      } finally {
        if (active && isMounted.current) setIsProcessing(false);
      }
    };

    const t = setTimeout(process, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [uri, preset]);

  const player = useVideoPlayer(filteredUri || uri, (p) => {
    p.loop = true;
    p.play();
  });

  // Hot-swap video player source when filter is ready
  useEffect(() => {
    if (player && filteredUri && filteredUri !== uri) {
      player.replace(filteredUri);
    }
  }, [filteredUri]);

  // Cleanup temp files
  useEffect(() => {
    return () => {
      tempFilesRef.current.forEach(async (path) => {
        try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch { }
      });
    };
  }, []);

  const handleSave = useCallback(async () => {
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
        if (isMounted.current && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(targetUri);
        }
      }
    } catch (err) {
      if (isMounted.current) Alert.alert('Error', 'Failed to save video.');
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [isProcessing]);

  const handleShare = useCallback(async () => {
    const targetUri = filteredUriRef.current;
    setIsSharing(true);
    try {
      if (isMounted.current && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri);
      }
    } catch (err) { /* noop */ }
    finally { if (isMounted.current) setIsSharing(false); }
  }, []);

  const VIDEO_HEIGHT = isTablet ? SCREEN_HEIGHT * 0.6 : SCREEN_HEIGHT * 0.65;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isTablet ? 32 : 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}>
          <X size={22 * uiScale} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.presetName, { fontSize: 16 * uiScale }]}>{preset.name}</Text>
          <Text style={[styles.statusSub, { fontSize: 10 * uiScale }]}>
            {isProcessing ? 'DEVELOPING...' : filterApplied ? 'FILTER APPLIED' : 'ORIGINAL PREVIEW'}
          </Text>
        </View>
        <View style={{ width: 44 * uiScale }} />
      </View>

      {/* Video View */}
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT, width: isTablet ? Math.min(SCREEN_WIDTH - 64, 800) : '100%', alignSelf: 'center', borderRadius: isTablet ? 16 : 0, overflow: 'hidden' }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
        
        {isProcessing && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#FFB800" />
            <Text style={[styles.overlayText, { fontSize: 14 * uiScale }]}>Developing video...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorOverlay}>
            <Info size={32 * uiScale} color="#FF3B30" />
            <Text style={[styles.errorText, { fontSize: 14 * uiScale }]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Real-time overlay preview (if not yet processed) */}
        {!filterApplied && !isProcessing && preset.settings.tintOpacity > 0 && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: preset.settings.tint, opacity: preset.settings.tintOpacity * 0.5 }]} pointerEvents="none" />
        )}
      </View>

      {/* Actions */}
      <ScrollView style={styles.bottomScroll} contentContainerStyle={[styles.bottomContent, { paddingHorizontal: isTablet ? 32 : 20 }]}>
        <View style={styles.infoRow}>
          <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
          <Text style={[styles.presetInfo, { fontSize: 13 * uiScale }]}>
            Using {preset.name} filter ({preset.cameraType})
          </Text>
        </View>

        <View style={[styles.actions, { gap: isTablet ? 24 : 12 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary, (isProcessing || isSharing) && styles.btnDisabled, { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale }]}
            onPress={handleShare}
            disabled={isProcessing || isSharing}
          >
            {isSharing ? <ActivityIndicator color="#FFF" /> : <Share2 size={20 * uiScale} color="#FFF" />}
            <Text style={[styles.actionBtnText, { fontSize: 15 * uiScale }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, (isProcessing || isSaving) && styles.btnDisabled, { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale }]}
            onPress={handleSave}
            disabled={isProcessing || isSaving}
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

      {/* Hidden Skia Canvas for video overlay generation */}
      <View style={{ position: 'absolute', top: -9999, left: -9999, width: canvasWidth, height: canvasHeight, opacity: 0 }}>
        <Canvas ref={canvasRef} style={{ width: canvasWidth, height: canvasHeight }}>
          {/* Vignette */}
          {preset.settings.vignette > 0 && (
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight}>
              <RadialGradient
                c={{ x: canvasWidth / 2, y: canvasHeight / 2 }}
                r={canvasHeight * 0.72}
                colors={['transparent', `rgba(0,0,0,${preset.settings.vignette * 0.9})`]}
              />
            </Rect>
          )}

          {/* Light leaks */}
          {leakParams && (
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight}>
              <SkiaLinearGradient
                start={{ x: canvasWidth * leakParams.startFX, y: canvasHeight * leakParams.startFY }}
                end={{ x: canvasWidth * leakParams.endFX, y: canvasHeight * leakParams.endFY }}
                colors={leakParams.colors}
              />
            </Rect>
          )}

          {/* Halation */}
          {preset.settings.halation > 0 && (
            <Rect x={canvasWidth * 0.1} y={0} width={canvasWidth * 0.8} height={canvasHeight * 0.6}>
              <SkiaLinearGradient
                start={{ x: canvasWidth * 0.5, y: 0 }}
                end={{ x: canvasWidth * 0.5, y: canvasHeight * 0.6 }}
                colors={[`rgba(255,60,0,${preset.settings.halation * 0.45})`, 'transparent']}
              />
            </Rect>
          )}

          {/* Flash */}
          {preset.settings.flash > 0 && (
            <Rect x={canvasWidth * 0.1} y={canvasHeight * 0.05} width={canvasWidth * 0.8} height={canvasHeight * 0.7} opacity={preset.settings.flash * 0.65}>
              <RadialGradient
                c={{ x: canvasWidth / 2, y: canvasHeight * 0.35 }}
                r={canvasHeight * 0.5}
                colors={[preset.settings.flashColor || '#FFFFF0', 'transparent']}
              />
            </Rect>
          )}

          {/* Grain */}
          {preset.settings.grain > 0 && (
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} opacity={preset.settings.grain * 0.55}>
              <Turbulence freqX={0.65} freqY={0.65} octaves={3} />
            </Rect>
          )}

          {/* Dust particles */}
          {dustParticles.map((p, i) => (
            <Circle key={`d${i}`} cx={p.x} cy={p.y} r={p.size / 2} color={`rgba(200,190,170,${p.opacity})`} />
          ))}

          {/* Scratches */}
          {scratches.map((sc, i) => (
            <Rect key={`sc${i}`} x={sc.x} y={sc.top} width={2} height={sc.h} color={`rgba(255,255,255,${sc.opacity})`} />
          ))}

          {/* Polaroid frame */}
          {preset.frameType === 'polaroid' && (
            <Group>
              <Rect x={0} y={0} width={canvasWidth} height={54} color="#FFF" />
              <Rect x={0} y={1726} width={canvasWidth} height={194} color="#FFF" />
              <Rect x={0} y={54} width={54} height={1672} color="#FFF" />
              <Rect x={1026} y={54} width={54} height={1672} color="#FFF" />
            </Group>
          )}

          {/* Half-Frame */}
          {preset.frameType === 'half-frame' && (
            <Group>
              <Rect x={534} y={0} width={12} height={canvasHeight} color="#111" />
              <Rect x={0} y={0} width={15} height={canvasHeight} color="#111" />
              <Rect x={1065} y={0} width={15} height={canvasHeight} color="#111" />
              {Array.from({ length: 8 }).map((_, i) => (
                <RoundedRect key={`hl${i}`} x={2} y={i * (canvasHeight / 8) + 4} width={11} height={canvasHeight / 8 - 8} r={3} color="#1A1A1A" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <RoundedRect key={`hr${i}`} x={1067} y={i * (canvasHeight / 8) + 4} width={11} height={canvasHeight / 8 - 8} r={3} color="#1A1A1A" />
              ))}
            </Group>
          )}

          {/* 8mm / 16mm */}
          {(preset.frameType === '8mm' || preset.frameType === '16mm') && (
            <Group>
              <Rect x={0} y={0} width={preset.frameType === '16mm' ? 120 : 90} height={canvasHeight} color="#0A0A0A" />
              <Rect x={canvasWidth - (preset.frameType === '16mm' ? 120 : 90)} y={0} width={preset.frameType === '16mm' ? 120 : 90} height={canvasHeight} color="#0A0A0A" />
              {sprocketHoles('left', preset.frameType === '16mm' ? 120 : 90)}
              {sprocketHoles('right', preset.frameType === '16mm' ? 120 : 90)}
            </Group>
          )}

          {/* Fisheye */}
          {preset.frameType === 'fisheye' && (
            <Group>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color="#000" />
              <Circle cx={540} cy={960} r={496} color="#000" blendMode="clear" />
            </Group>
          )}

          {/* Camcorder scanlines */}
          {preset.frameType === 'camcorder' && (
            <Group>
              {Array.from({ length: Math.floor(canvasHeight / 15) }).map((_, i) => (
                <Rect key={i} x={0} y={i * 15} width={canvasWidth} height={3} color="rgba(0,0,0,0.06)" />
              ))}
            </Group>
          )}

          {/* VHS scanlines */}
          {preset.frameType === 'vhs' && (
            <Group>
              {Array.from({ length: Math.floor(canvasHeight / 12) }).map((_, i) => (
                <Rect key={i} x={0} y={i * 12} width={canvasWidth} height={3} color="rgba(0,0,0,0.08)" />
              ))}
              <Rect x={0} y={canvasHeight * 0.72} width={canvasWidth} height={9} color="rgba(255,255,255,0.04)" />
            </Group>
          )}

          {/* Digital */}
          {preset.frameType === 'digital' && (
            <Group>
              <Rect x={0} y={0} width={canvasWidth} height={90} color="rgba(0,0,0,0.55)" />
              <Rect x={0} y={canvasHeight - 90} width={canvasWidth} height={90} color="rgba(0,0,0,0.55)" />
            </Group>
          )}

          {/* Disposable */}
          {preset.frameType === 'disposable' && (
            <Group>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color="#000" />
              <RoundedRect x={12} y={12} width={canvasWidth - 24} height={canvasHeight - 24} r={48} color="#000" blendMode="clear" />
            </Group>
          )}
        </Canvas>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  presetName: { color: '#FFF', fontWeight: '800', letterSpacing: 0.5 },
  statusSub: { color: '#FFB800', fontWeight: '700', marginTop: 2 },
  
  videoContainer: {
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  overlayText: { color: '#FFB800', fontWeight: '700' },
  
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: { color: '#FFF', textAlign: 'center', fontWeight: '500' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  retryText: { color: '#FFF', fontWeight: '700' },

  bottomScroll: { flex: 1 },
  bottomContent: { paddingTop: 16, paddingBottom: 20 },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
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
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,184,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.1)',
  },
  proHintText: { color: 'rgba(255,184,0,0.6)', textAlign: 'center', lineHeight: 16 },
});
