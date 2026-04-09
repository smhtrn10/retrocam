import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { X, Download, Share2 } from 'lucide-react-native';
import { CAMERA_PRESETS } from '@/constants/presets';
import { buildFFmpegArgs } from '@/utils/videoFilter';

let FFmpegKit: any = null;
let ReturnCode: any = null;
try {
  const ffmpegModule = require('ffmpeg-kit-react-native');
  FFmpegKit = ffmpegModule.FFmpegKit;
  ReturnCode = ffmpegModule.ReturnCode;
  console.log('[RetroCam] VideoPreview: FFmpegKit loaded');
} catch {
  console.log('[RetroCam] VideoPreview: FFmpegKit not available (Expo Go)');
}

// Helper to get raw path for FFmpeg
const getSafePath = (uri: string) => {
  if (!uri) return '';
  // Single normalization point: handle arrays and decode once
  const rawUri = decodeURIComponent(Array.isArray(uri) ? uri[0] : uri);
  return rawUri.replace(/^file:\/\//, '');
};

export default function VideoPreviewScreen() {
  const { uri, presetId } = useLocalSearchParams<{ uri: string; presetId: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [filteredUri, setFilteredUri] = useState<string>(uri);
  const [filterApplied, setFilterApplied] = useState(false);
  const [filterFailed, setFilterFailed] = useState(false);
  
  // Track temp files for cleanup
  const tempFilesRef = useRef<string[]>([]);
  const preset = CAMERA_PRESETS.find(p => p.id === presetId) ?? CAMERA_PRESETS[0];

  // Initialize player with original uri — replace() called after filter is applied
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  // Replace source only when filteredUri actually changes (after FFmpeg succeeds)
  useEffect(() => {
    if (player && filteredUri && filteredUri !== uri) {
      player.replace(filteredUri);
    }
  }, [filteredUri]); // intentionally exclude player and uri — only react to filter result

  // Apply FFmpeg filter once on mount — uri and presetId are stable route params
  useEffect(() => {
    if (!FFmpegKit || !uri) return;

    const applyFilter = async () => {
      setIsProcessing(true);
      setFilterFailed(false);

      const rawInputPath = getSafePath(uri);
      const fileUri = rawInputPath.startsWith('/') ? `file://${rawInputPath}` : rawInputPath;

      const fileName = `retrocam_video_${Date.now()}.mp4`;
      const outputUri = (FileSystem.documentDirectory ?? '') + fileName;
      const rawOutputPath = getSafePath(outputUri);

      try {
        const args = buildFFmpegArgs(rawInputPath, rawOutputPath, preset.settings);
        console.log('[RetroCam] FFmpeg inputPath:', rawInputPath);
        console.log('[RetroCam] FFmpeg outputPath:', rawOutputPath);
        console.log('[RetroCam] FFmpeg filter args:', args.join(' '));

        const inputExists = await FileSystem.getInfoAsync(fileUri);
        if (!inputExists.exists) {
          throw new Error(`Input file does not exist: ${fileUri}`);
        }

        const session = await FFmpegKit.executeWithArguments(args);
        const returnCode = await session.getReturnCode();

        console.log('[RetroCam] FFmpeg return code:', returnCode?.getValue?.());

        if (ReturnCode && ReturnCode.isSuccess(returnCode)) {
          console.log('[RetroCam] Filter applied successfully:', outputUri);
          tempFilesRef.current.push(outputUri);
          setFilteredUri(outputUri);
          setFilterApplied(true);
        } else {
          const logs = await session.getLogs();
          const lastLogs = logs?.slice(-15).map((l: any) => l.getMessage()).join('\n') ?? 'No logs available';
          const failStackTrace = await session.getFailStackTrace();

          console.error('[RetroCam] FFmpeg failed with code:', returnCode?.getValue());
          console.error('[RetroCam] FFmpeg Error Logs:\n', lastLogs);
          if (failStackTrace) console.error('[RetroCam] FFmpeg StackTrace:', failStackTrace);

          setFilterFailed(true);
          const errorSnippet = lastLogs.length > 500 ? `...${lastLogs.slice(-500)}` : lastLogs;
          Alert.alert(
            'Filter Warning',
            `Could not apply the cinematic filter. Details:\n\n${errorSnippet}`,
            [{ text: 'OK' }]
          );
        }
      } catch (e: any) {
        console.error('[RetroCam] FFmpeg critical error:', e);
        setFilterFailed(true);
        Alert.alert('Processing Error', `An error occurred: ${e.message}`);
      } finally {
        setIsProcessing(false);
      }
    };

    applyFilter();
  }, []); // Run once on mount — uri and preset are stable from route params

  // Cleanup temp files on unmount
  useEffect(() => {
    return () => {
      tempFilesRef.current.forEach(async (path) => {
        try {
          await FileSystem.deleteAsync(path, { idempotent: true });
        } catch { /* noop */ }
      });
    };
  }, []);

  const saveToGallery = useCallback(async (fileUri: string) => {
    // Check permission first to avoid double dialog on iOS
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
      if (newStatus !== 'granted') return false;
    }
    await MediaLibrary.saveToLibraryAsync(fileUri);
    return true;
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const saved = await saveToGallery(filteredUri);
      if (saved) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Clean up temp file after successful save — no longer needed on disk
        try {
          await FileSystem.deleteAsync(filteredUri, { idempotent: true });
          tempFilesRef.current = tempFilesRef.current.filter(p => p !== filteredUri);
        } catch { /* noop */ }
        Alert.alert('Saved!', 'Video saved to your gallery');
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filteredUri, { dialogTitle: 'Save your video' });
      } else {
        Alert.alert('Error', 'Could not save video.');
      }
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Failed to save video');
    } finally {
      setIsSaving(false);
    }
  }, [filteredUri, saveToGallery]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filteredUri, { mimeType: 'video/mp4' });
      }
    } catch { /* noop */ }
    finally { setIsSharing(false); }
  }, [filteredUri]);

  const statusBadge = () => {
    if (!FFmpegKit) return <Text style={styles.badgeWarn}>Preview Only (Expo Go)</Text>;
    if (isProcessing) return <Text style={styles.badgeProcessing}>Processing...</Text>;
    if (filterApplied) return <Text style={styles.badgeSuccess}>✓ Filter Applied</Text>;
    if (filterFailed) return <Text style={styles.badgeWarn}>⚠ Filter Failed — Original</Text>;
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <X size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.presetName}>{preset.name}</Text>
          {statusBadge()}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Overlay effects shown only when filter not yet applied */}
        {!filterApplied && preset.settings.tintOpacity > 0 && (
          <View style={[StyleSheet.absoluteFillObject, {
            backgroundColor: preset.settings.tint,
            opacity: preset.settings.tintOpacity,
          }]} />
        )}
        {!filterApplied && preset.settings.vignette > 0 && (
          <View style={[styles.vignette, { opacity: preset.settings.vignette * 0.9 }]} />
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#FFB800" size="large" />
            <Text style={styles.processingText}>Applying {preset.name} filter...</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoStrip}>
        <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
        <Text style={styles.presetDesc}>{preset.description}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary, (isSharing || isProcessing) && styles.actionBtnDisabled]}
          onPress={handleShare}
          disabled={isSharing || isProcessing}
        >
          {isSharing ? <ActivityIndicator color="#FFF" size="small" /> : <Share2 size={20} color="#FFF" />}
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary, (isSaving || isProcessing) && styles.actionBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving || isProcessing}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Download size={20} color="#000" />
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  presetName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  badgeSuccess: { color: '#06D6A0', fontSize: 11, fontWeight: '600', marginTop: 2 },
  badgeWarn: { color: '#FFB800', fontSize: 11, fontWeight: '600', marginTop: 2 },
  badgeProcessing: { color: '#888', fontSize: 11, marginTop: 2 },
  videoContainer: { flex: 1, backgroundColor: '#000', position: 'relative' },
  video: { flex: 1 },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  processingText: { color: '#FFB800', fontSize: 14, fontWeight: '700' },
  infoStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetDesc: { color: '#666', fontSize: 12, flex: 1 },
  actions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 28,
  },
  actionBtnPrimary: { backgroundColor: '#FFB800' },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
