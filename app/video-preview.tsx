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

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const preset = useMemo(
    () => CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0],
    [presetId]
  );

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
        const args = buildFFmpegArgs(rawInputPath, rawOutputPath, preset.settings);
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
