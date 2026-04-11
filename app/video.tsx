import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Video, Square, Aperture, Zap } from 'lucide-react-native';
import { CAMERA_PRESETS, CameraPreset } from '@/constants/presets';
import { CameraCarousel } from '@/components/CameraCarousel';
import { usePurchases } from '@/hooks/usePurchases';
import { useDevice } from '@/hooks/useDevice';

// Show all presets in video screen, default to free vhs-glitch
const VIDEO_PRESETS = CAMERA_PRESETS;
const DEFAULT_VIDEO_PRESET = CAMERA_PRESETS.find(p => p.id === 'vhs-glitch') ?? CAMERA_PRESETS[0];

type VideoEffect = 'none' | 'vhs' | 'glitch' | 'rgb';

 export default function VideoScreen() {
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isTablet, scale: uiScale } = useDevice();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => {
        if (isMounted.current) setIsCameraActive(true);
      }, 300);
      return () => {
        clearTimeout(t);
        if (isRecordingRef.current) cameraRef.current?.stopRecording();
        setIsCameraActive(false);
      };
    }, [])
  );
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [selectedPreset, setSelectedPreset] = useState<CameraPreset>(DEFAULT_VIDEO_PRESET);
  const [effect, setEffect] = useState<VideoEffect>('none');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isPro, showPaywall } = usePurchases();

  const effectLabel: Record<VideoEffect, string> = {
    none: 'Clean',
    vhs: 'VHS',
    glitch: 'Glitch',
    rgb: 'RGB',
  };

  const cycleEffect = useCallback(() => {
    const effects: VideoEffect[] = ['none', 'vhs', 'glitch', 'rgb'];
    setEffect((prev) => {
      const idx = effects.indexOf(prev);
      return effects[(idx + 1) % effects.length];
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    
    if (!isPro && selectedPreset.isPro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showPaywall(selectedPreset.id);
      return;
    }

    if (!camPermission?.granted) { await requestCamPermission(); return; }
    if (!micPermission?.granted) { await requestMicPermission(); return; }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });

      if (isMounted.current) {
        setIsRecording(false);
        isRecordingRef.current = false;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        if (video?.uri) {
          router.push({
            pathname: '/video-preview' as any,
            params: { uri: encodeURIComponent(video.uri), presetId: selectedPreset.id },
          });
        }
      }
    } catch (err) {
      console.error('Record error:', err);
      if (isMounted.current) {
        setIsRecording(false);
        isRecordingRef.current = false;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
    }
  }, [isRecording, camPermission, micPermission, requestCamPermission, requestMicPermission, selectedPreset, isPro, showPaywall]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
    setIsRecording(false);
    isRecordingRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isRecording]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // VHS scanline overlay
  const scanlineOpacity = effect === 'vhs' ? 0.12 : 0;
  // RGB split — shown as colored border tint
  const rgbActive = effect === 'rgb';
  // Glitch — flicker tint
  const glitchActive = effect === 'glitch';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isTablet ? 32 : 16 }]}>
        <TouchableOpacity style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]} onPress={() => router.back()}>
          <X size={22 * uiScale} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: 16 * uiScale }]}>{t('common.video')}</Text>
        <TouchableOpacity style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]} onPress={cycleEffect}>
          <Zap size={22 * uiScale} color={effect !== 'none' ? '#FFB800' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Camera — only mount when active */}
      <View style={[styles.cameraWrapper, { 
        aspectRatio: isTablet ? 4 / 3 : 9 / 16, 
        width: isTablet ? Math.min(SCREEN_WIDTH - 64, 800) : '100%',
        borderRadius: isTablet ? 16 : 12,
      }]}>
        {isCameraActive && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mode="video"
            videoQuality="1080p"
          />
        )}

        {/* Tint overlay */}
        {selectedPreset.settings.tintOpacity > 0 && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: selectedPreset.settings.tint, opacity: selectedPreset.settings.tintOpacity },
            ]}
          />
        )}

        {/* VHS scanlines */}
        {scanlineOpacity > 0 && (
          <View style={[styles.scanlines, { opacity: scanlineOpacity }]} />
        )}

        {/* RGB split border */}
        {rgbActive && (
          <>
            <View style={[styles.rgbLayer, { borderColor: 'rgba(255,0,0,0.25)', transform: [{ translateX: -3 }] }]} />
            <View style={[styles.rgbLayer, { borderColor: 'rgba(0,0,255,0.25)', transform: [{ translateX: 3 }] }]} />
          </>
        )}

        {/* Glitch tint */}
        {glitchActive && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,255,200,0.06)' }]} />
        )}

        {/* Vignette */}
        {selectedPreset.settings.vignette > 0 && (
          <View style={[styles.vignette, { opacity: selectedPreset.settings.vignette * 0.8 }]} />
        )}

        {/* Effect badge */}
        {effect !== 'none' && (
          <View style={styles.effectBadge}>
            <Text style={styles.effectBadgeText}>{effectLabel[effect]}</Text>
          </View>
        )}

        {/* Recording timer */}
        {isRecording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recTime}>{formatTime(recordingSeconds)}</Text>
          </View>
        )}

        {/* Timestamp */}
        {selectedPreset.settings.timestamp && (
          <Text style={styles.timestamp}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomContainer, { paddingBottom: Platform.OS === 'ios' ? (isTablet ? 32 : 20) : 12 }]}>
        <CameraCarousel
          presets={VIDEO_PRESETS}
          selectedId={selectedPreset.id}
          onSelect={(preset: CameraPreset) => {
            if (!isPro && preset.isPro) {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              showPaywall(preset.id);
            } else {
              setSelectedPreset(preset);
            }
          }}
          isPro={isPro}
        />

        <View style={[styles.controls, { paddingHorizontal: isTablet ? 80 : 40 }]}>
          <TouchableOpacity
            style={[styles.flipButton, { width: 56 * uiScale, height: 56 * uiScale, borderRadius: 28 * uiScale }]}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Aperture size={24 * uiScale} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Record button */}
          <TouchableOpacity
            style={[
              styles.recordButton, 
              { width: 72 * uiScale, height: 72 * uiScale, borderRadius: 36 * uiScale, borderWidth: 4 * uiScale },
              isRecording && styles.recordingButton
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square size={28 * uiScale} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Video size={28 * uiScale} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={{ width: 56 * uiScale }} />
        </View>

        <Text style={[styles.hint, { fontSize: 11 * uiScale }]}>{t('video.hint')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerTitle: { color: '#FFF', fontWeight: '600' },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraWrapper: {
    flex: 1,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  camera: { flex: 1 },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  rgbLayer: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderRadius: 12,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  effectBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,184,0,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  effectBadgeText: { color: '#000', fontSize: 11, fontWeight: '700' },
  recIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  recTime: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  timestamp: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    color: 'rgba(255,180,50,0.9)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomContainer: {
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  flipButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center', alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FFFFFF',
  },
  hint: {
    color: '#555',
    textAlign: 'center',
    paddingBottom: 4,
  },
});
