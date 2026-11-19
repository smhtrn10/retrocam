import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  Linking,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  RefreshCw,
  Settings,
  ImageIcon,
  Sparkles,
  TrendingUp,
  Video,
  FlipHorizontal,
  Lock,
  Zap,
  ZapOff,
  Flame,
  SunMedium,
  Volume2,
  VolumeX,
  Timer,
  Grid3x3,
  Sliders,
  Camera as CameraIcon,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraCarousel } from '@/components/CameraCarousel';
import { ShutterButton } from '@/components/ShutterButton';
import { CameraPreset, CameraType as CamType, CAMERA_PRESETS, CAMERA_TYPE_ICONS, CAMERA_TYPE_LABELS } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { useTrending } from '@/hooks/useTrending';
import { useDevice } from '@/hooks/useDevice';
import { CAMERA_LENSES, LensType } from '@/constants/lenses';
import { playMechanicalShutterSound, playTimerTickSound } from '@/utils/soundEngine';
import { trackLaunchAndPromptReview } from '@/utils/storeReview';

// ─────────────────────────────────────────────────────────────
//  Viewfinder HUD Overlay (Requirement R6)
// ─────────────────────────────────────────────────────────────
interface ViewfinderHudProps {
  preset: CameraPreset;
  uiScale: number;
}

function ViewfinderHud({ preset, uiScale }: ViewfinderHudProps) {
  const isCamcorder = preset.frameType === 'camcorder' || preset.cameraType === 'camcorder' || preset.cameraType === 'vhs';
  const isDigital = preset.frameType === 'digital' || preset.cameraType === 'digital-y2k';
  const isHalfFrame = preset.frameType === 'half-frame' || preset.cameraType === 'half-frame';
  const isAnalog35mm = !isHalfFrame && (preset.cameraType === '35mm' || preset.cameraType === 'disposable' || preset.frameType === 'disposable');

  // Camcorder blinking REC animation (native driver)
  const recBlinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isCamcorder) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(recBlinkAnim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(recBlinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [isCamcorder, recBlinkAnim]);

  // Camcorder live timecode running clock (isolated to prevent full CameraScreen re-renders)
  const [hudTime, setHudTime] = useState(() => new Date());
  useEffect(() => {
    if (!isCamcorder) return;
    const interval = setInterval(() => {
      setHudTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isCamcorder]);

  const timecodeStr = useMemo(() => {
    const h = String(hudTime.getHours()).padStart(2, '0');
    const m = String(hudTime.getMinutes()).padStart(2, '0');
    const s = String(hudTime.getSeconds()).padStart(2, '0');
    return `TC ${h}:${m}:${s}`;
  }, [hudTime]);

  if (!isCamcorder && !isDigital && !isHalfFrame && !isAnalog35mm) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* ── 1. Camcorder Mode HUD ── */}
      {isCamcorder && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.hudTopBar, { paddingHorizontal: 12 * uiScale, paddingTop: 10 * uiScale }]}>
            <Animated.View style={[styles.hudRecRow, { opacity: recBlinkAnim }]}>
              <View style={[styles.hudRecDot, { width: 9 * uiScale, height: 9 * uiScale, borderRadius: 4.5 * uiScale }]} />
              <Text style={[styles.hudRecText, { fontSize: 11 * uiScale }]}>REC</Text>
            </Animated.View>
            <Text style={[styles.hudCamcorderFormat, { fontSize: 11 * uiScale }]}>SP  Hi8</Text>
            <View style={styles.hudBatteryRow}>
              <View style={[styles.hudBatteryBox, { width: 22 * uiScale, height: 11 * uiScale }]}>
                <View style={[styles.hudBatterySegment, { width: 4 * uiScale, height: 7 * uiScale }]} />
                <View style={[styles.hudBatterySegment, { width: 4 * uiScale, height: 7 * uiScale }]} />
                <View style={[styles.hudBatterySegment, { width: 4 * uiScale, height: 7 * uiScale }]} />
              </View>
              <View style={[styles.hudBatteryNub, { width: 2.5 * uiScale, height: 5 * uiScale }]} />
            </View>
          </View>
          <View style={[styles.hudBottomBar, { paddingHorizontal: 12 * uiScale, paddingBottom: 10 * uiScale }]}>
            <Text style={[styles.hudTimecode, { fontSize: 11 * uiScale }]}>{timecodeStr}</Text>
            <View style={styles.hudZoomTrack}>
              <Text style={[styles.hudZoomLabel, { fontSize: 9 * uiScale }]}>W</Text>
              <View style={[styles.hudZoomLine, { width: 34 * uiScale }]}>
                <View style={[styles.hudZoomIndicator, { left: 14 * uiScale }]} />
              </View>
              <Text style={[styles.hudZoomLabel, { fontSize: 9 * uiScale }]}>T</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── 2. Digicam Mode HUD ── */}
      {isDigital && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.hudTopBar, { paddingHorizontal: 12 * uiScale, paddingTop: 10 * uiScale }]}>
            <Text style={[styles.hudDigitalAuto, { fontSize: 11 * uiScale }]}>[+] AUTO</Text>
            <Text style={[styles.hudDigitalQuality, { fontSize: 10 * uiScale }]}>HQ 3.2M</Text>
            <View style={styles.hudBatteryRow}>
              <View style={[styles.hudDigitalBatteryBox, { width: 20 * uiScale, height: 10 * uiScale }]}>
                <View style={[styles.hudDigitalBatteryFill, { width: 12 * uiScale }]} />
              </View>
              <View style={[styles.hudDigitalBatteryNub, { width: 2 * uiScale, height: 4 * uiScale }]} />
            </View>
          </View>
          <View style={styles.hudDigitalCenterBox}>
            <View style={[styles.hudDigitalAfTarget, { width: 36 * uiScale, height: 36 * uiScale }]} />
          </View>
          <View style={[styles.hudBottomBar, { paddingHorizontal: 12 * uiScale, paddingBottom: 10 * uiScale }]}>
            <Text style={[styles.hudDigitalIso, { fontSize: 11 * uiScale }]}>ISO 400</Text>
            <Text style={[styles.hudDigitalStorage, { fontSize: 10 * uiScale }]}>[ 128MB ]</Text>
          </View>
        </View>
      )}

      {/* ── 3. 35mm / Disposable Mode HUD ── */}
      {isAnalog35mm && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.hudTopBar, { paddingHorizontal: 12 * uiScale, paddingTop: 10 * uiScale }]}>
            <View style={[styles.hudReadyBadge, { paddingHorizontal: 8 * uiScale, paddingVertical: 3 * uiScale, borderRadius: 10 * uiScale }]}>
              <View style={[styles.hudReadyLed, { width: 7 * uiScale, height: 7 * uiScale, borderRadius: 3.5 * uiScale }]} />
              <Text style={[styles.hudReadyText, { fontSize: 9 * uiScale }]}>READY</Text>
            </View>
            <View style={[styles.hudFrameCounterBadge, { paddingHorizontal: 9 * uiScale, paddingVertical: 3 * uiScale, borderRadius: 12 * uiScale }]}>
              <Text style={[styles.hudFrameCounterText, { fontSize: 11 * uiScale }]}>[ 24 ]</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── 4. Half-Frame Mode HUD ── */}
      {isHalfFrame && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.hudHalfFrameSplitLine} />
          <View style={[styles.hudTopBar, { paddingHorizontal: 10 * uiScale, paddingTop: 8 * uiScale }]}>
            <View style={[styles.hudHalfFrameBadge, { paddingHorizontal: 6 * uiScale, paddingVertical: 2 * uiScale }]}>
              <Text style={[styles.hudHalfFrameBadgeText, { fontSize: 9 * uiScale }]}>FRAME 1</Text>
            </View>
            <View style={[styles.hudHalfFrameBadge, { paddingHorizontal: 6 * uiScale, paddingVertical: 2 * uiScale }]}>
              <Text style={[styles.hudHalfFrameBadgeText, { fontSize: 9 * uiScale }]}>FRAME 2</Text>
            </View>
          </View>
          <View style={styles.hudHalfFrameCenterMarker}>
            <View style={[styles.hudHalfFrameCenterDot, { width: 6 * uiScale, height: 6 * uiScale, borderRadius: 3 * uiScale }]} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isTablet, scale: uiScale } = useDevice();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [selectedPreset, setSelectedPreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CamType | 'all'>('all');
  const cameraRef = useRef<CameraView>(null);
  const isMounted = useRef(true);
  const { isPro, showPaywall, isOnboardingComplete } = usePurchases();
  const trendingPresets = useTrending();

  // If first launch / onboarding not completed, route to onboarding immediately
  useEffect(() => {
    if (isOnboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [isOnboardingComplete]);

  // Prompt native store review on 2nd and subsequent launches if not reviewed
  useEffect(() => {
    trackLaunchAndPromptReview();
  }, []);
  
  const [aspectRatio, setAspectRatio] = useState<'full' | '1:1' | '3:2' | '4:5'>('full');
  const [isSnapMode, setIsSnapMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [isDoubleExposureMode, setIsDoubleExposureMode] = useState(false);
  const [doubleExposureFirstPhoto, setDoubleExposureFirstPhoto] = useState<string | null>(null);
  const [selectedLens, setSelectedLens] = useState<LensType>('prime');
  const [showLensPicker, setShowLensPicker] = useState(false);

  // Requirement R1: Camera Hardware Controls State
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto' | 'torch'>('off');
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0);
  const zoomRef = useRef(zoom);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(0);

  const [ev, setEv] = useState<number>(0);
  const [showEvControls, setShowEvControls] = useState<boolean>(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);

  const handleCameraReady = useCallback(async () => {
    try {
      if (cameraRef.current && typeof (cameraRef.current as any).getAvailablePictureSizesAsync === 'function') {
        const sizes = await (cameraRef.current as any).getAvailablePictureSizesAsync();
        if (Array.isArray(sizes) && sizes.length > 0) {
          let bestSize = sizes[0];
          let maxPixels = 0;
          for (const s of sizes) {
            const parts = s.split('x');
            if (parts.length === 2) {
              const w = parseInt(parts[0], 10);
              const h = parseInt(parts[1], 10);
              if (!isNaN(w) && !isNaN(h) && w * h > maxPixels) {
                maxPixels = w * h;
                bestSize = s;
              }
            }
          }
          if (bestSize) {
            setPictureSize(bestSize);
          }
        }
      }
    } catch (e) {
      console.warn('[RetroCam] Failed to get available picture sizes:', e);
    }
  }, []);

  // Tap-to-Focus Reticle State
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnimScale = useRef(new Animated.Value(1.5)).current;
  const focusAnimOpacity = useRef(new Animated.Value(0)).current;
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autofocus, setAutofocus] = useState<'on' | 'off'>('on');

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    AsyncStorage.getItem('camera_shutter_muted').then((v) => {
      if (v !== null) setIsMuted(v === 'true');
    }).catch(() => {});
    AsyncStorage.getItem('camera_grid_enabled').then((v) => {
      if (v !== null) setShowGrid(v === 'true');
    }).catch(() => {});

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

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
        setIsCameraActive(false);
      };
    }, [])
  );

  // Preset name fade animation
  const nameOpacity = useRef(new Animated.Value(1)).current;
  const nameTranslateY = useRef(new Animated.Value(0)).current;

  // Mechanical shutter flash animation ref (Requirement R6)
  const shutterFlashOpacity = useRef(new Animated.Value(0)).current;

  const triggerShutterFlash = useCallback(() => {
    shutterFlashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(shutterFlashOpacity, {
        toValue: 1,
        duration: 35,
        useNativeDriver: true,
      }),
      Animated.timing(shutterFlashOpacity, {
        toValue: 0,
        duration: 105,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shutterFlashOpacity]);

  const dailyCamera = useMemo(() => {
    const today = new Date().getDay();
    const proPresets = CAMERA_PRESETS.filter((p) => p.isPro);
    return proPresets[today % proPresets.length];
  }, []);

  // Filtered presets by category
  const filteredPresets = useMemo(() => {
    if (activeCategory === 'all') return CAMERA_PRESETS;
    return CAMERA_PRESETS.filter((p) => p.cameraType === activeCategory);
  }, [activeCategory]);

  // All unique camera types present
  const categories = useMemo<Array<CamType | 'all'>>(() => {
    const types = Array.from(new Set(CAMERA_PRESETS.map((p) => p.cameraType))) as CamType[];
    return ['all', ...types];
  }, []);

  const getCameraSize = useMemo(() => {
    // For iPad, we use more square-ish or wider ratios to avoid extreme stretching
    const maxWidth = isTablet ? Math.min(SCREEN_WIDTH, 800) : SCREEN_WIDTH;
    
    switch (aspectRatio) {
      case '1:1': return { width: maxWidth, height: maxWidth };
      case '3:2': return { width: maxWidth, height: maxWidth * 1.5 };
      case '4:5': return { width: maxWidth, height: maxWidth * 1.25 };
      default: {
        // approx full, but capped on tablet
        const fullHeight = isTablet ? SCREEN_HEIGHT * 0.75 : SCREEN_WIDTH * (16 / 9);
        return { width: maxWidth, height: fullHeight };
      }
    }
  }, [aspectRatio, SCREEN_WIDTH, SCREEN_HEIGHT, isTablet]);

  const toggleAspectRatio = useCallback(() => {
    const ratios: Array<'full' | '1:1' | '3:2' | '4:5'> = ['full', '1:1', '3:2', '4:5'];
    const nextIndex = (ratios.indexOf(aspectRatio) + 1) % ratios.length;
    setAspectRatio(ratios[nextIndex]);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [aspectRatio]);

  const toggleSnapMode = useCallback(() => {
    setIsSnapMode(prev => !prev);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const animatePresetChange = useCallback((fn: () => void) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.timing(nameTranslateY, { toValue: 8, duration: 100, useNativeDriver: true }),
      ]),
    ]).start(() => {
      fn();
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(nameTranslateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [nameOpacity, nameTranslateY]);

  const cycleFlashMode = useCallback(() => {
    const modes: Array<'off' | 'on' | 'auto' | 'torch'> = ['off', 'on', 'auto', 'torch'];
    const next = modes[(modes.indexOf(flashMode) + 1) % modes.length];
    setFlashMode(next);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [flashMode]);

  const cycleTimer = useCallback(() => {
    const timers: Array<0 | 3 | 10> = [0, 3, 10];
    const next = timers[(timers.indexOf(timerSeconds) + 1) % timers.length];
    setTimerSeconds(next);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [timerSeconds]);

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => {
      const next = !prev;
      AsyncStorage.setItem('camera_grid_enabled', next ? 'true' : 'false').catch(() => {});
      return next;
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      AsyncStorage.setItem('camera_shutter_muted', next ? 'true' : 'false').catch(() => {});
      return next;
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleViewfinderTap = useCallback((x: number, y: number) => {
    setFocusPoint({ x, y });
    focusAnimScale.setValue(1.5);
    focusAnimOpacity.setValue(1);

    Animated.spring(focusAnimScale, {
      toValue: 1.0,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setAutofocus('off');
    setTimeout(() => setAutofocus('on'), 50);

    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      Animated.timing(focusAnimOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setFocusPoint(null));
    }, 1800);
  }, [focusAnimScale, focusAnimOpacity]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.numberActiveTouches === 2;
        },
        onPanResponderGrant: (evt) => {
          if (evt.nativeEvent.touches.length === 2) {
            const t1 = evt.nativeEvent.touches[0];
            const t2 = evt.nativeEvent.touches[1];
            const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
            touchStartDistRef.current = dist;
            touchStartZoomRef.current = zoomRef.current;
          } else {
            touchStartDistRef.current = null;
          }
        },
        onPanResponderMove: (evt) => {
          if (evt.nativeEvent.touches.length === 2) {
            const t1 = evt.nativeEvent.touches[0];
            const t2 = evt.nativeEvent.touches[1];
            const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);

            // Dynamically initialize distance if two fingers touched down asynchronously
            if (!touchStartDistRef.current || touchStartDistRef.current <= 0) {
              touchStartDistRef.current = dist;
              touchStartZoomRef.current = zoomRef.current;
              return;
            }

            const factor = dist / touchStartDistRef.current;
            const delta = (factor - 1) * 0.75;
            const newZoom = Math.min(1.0, Math.max(0.0, touchStartZoomRef.current + delta));
            setZoom(Number(newZoom.toFixed(3)));
          } else {
            touchStartDistRef.current = null;
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          touchStartDistRef.current = null;
          if (
            Math.abs(gestureState.dx) < 10 &&
            Math.abs(gestureState.dy) < 10 &&
            evt.nativeEvent.locationX !== undefined &&
            evt.nativeEvent.locationY !== undefined
          ) {
            handleViewfinderTap(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
          }
        },
        onPanResponderTerminate: () => {
          touchStartDistRef.current = null;
        },
      }),
    [handleViewfinderTap]
  );

  const handleCaptureRef = useRef<(skipTimer?: boolean) => Promise<void>>(async () => {});

  const handleCapture = useCallback(async (skipTimer = false) => {
    if (isCapturing || !cameraRef.current) return;

    if (countdown !== null && !skipTimer) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (timerSeconds > 0 && !skipTimer) {
      setCountdown(timerSeconds);
      playTimerTickSound();
      let remaining = timerSeconds;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          setCountdown(remaining);
          playTimerTickSound();
        } else {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setCountdown(null);
          void handleCaptureRef.current(true);
        }
      }, 1000);
      return;
    }

    setIsCapturing(true);

    // Tactile mechanical shutter flash feedback & acoustic feedback (Requirement R6 + Audio)
    triggerShutterFlash();
    if (!isMuted) {
      playMechanicalShutterSound(selectedPreset.cameraType);
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.99,
        skipProcessing: false,
        shutterSound: !isMuted,
      });
      if (photo && isMounted.current) {
        if (isDoubleExposureMode) {
          if (!doubleExposureFirstPhoto) {
            setDoubleExposureFirstPhoto(photo.uri);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            const firstPhoto = doubleExposureFirstPhoto;
            setDoubleExposureFirstPhoto(null);
            router.push({
              pathname: '/preview',
              params: {
                uri: photo.uri,
                secondaryUri: firstPhoto,
                presetId: selectedPreset.id,
                aspectRatio,
                lens: selectedLens,
                ev: ev !== 0 ? String(ev) : undefined,
              },
            });
          }
        } else {
          router.push({
            pathname: '/preview',
            params: {
              uri: photo.uri,
              presetId: selectedPreset.id,
              aspectRatio,
              lens: selectedLens,
              ev: ev !== 0 ? String(ev) : undefined,
            },
          });
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
    } finally {
      if (isMounted.current) setIsCapturing(false);
    }
  }, [isCapturing, countdown, timerSeconds, isMuted, selectedPreset, isDoubleExposureMode, doubleExposureFirstPhoto, aspectRatio, selectedLens, ev, triggerShutterFlash]);

  useEffect(() => {
    handleCaptureRef.current = handleCapture;
  }, [handleCapture]);

  const handleGalleryImport = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });
      if (!result.canceled && result.assets[0] && isMounted.current) {
        const asset = result.assets[0];
        if (asset.type === 'video') {
          router.push({
            pathname: '/video-preview',
            params: { uri: encodeURIComponent(asset.uri), presetId: selectedPreset.id },
          });
        } else {
          router.push({
            pathname: '/preview',
            params: {
              uri: asset.uri,
              presetId: selectedPreset.id,
              aspectRatio,
              isImport: 'true',
              lens: selectedLens,
            },
          });
        }
      }
    } catch (error) {
      console.error('Gallery import error:', error);
    }
  }, [selectedPreset, aspectRatio, selectedLens]);

  const handleRandomCamera = useCallback(() => {
    if (!isPro) {
      showPaywall();
      return;
    }
    const randomIndex = Math.floor(Math.random() * CAMERA_PRESETS.length);
    animatePresetChange(() => setSelectedPreset(CAMERA_PRESETS[randomIndex]));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPro, showPaywall, animatePresetChange]);

  const handlePresetSelect = useCallback((preset: CameraPreset) => {
    if (!isPro && preset.isPro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showPaywall(preset.id);
      return;
    }
    animatePresetChange(() => setSelectedPreset(preset));
  }, [isPro, showPaywall, animatePresetChange]);

  const handleDailyCamera = useCallback(() => {
    if (!isPro && dailyCamera.isPro) {
      showPaywall(dailyCamera.id);
      return;
    }
    animatePresetChange(() => setSelectedPreset(dailyCamera));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPro, dailyCamera, showPaywall, animatePresetChange]);

  const handleTrendingSelect = useCallback((preset: CameraPreset) => {
    if (!isPro && preset.isPro) {
      showPaywall(preset.id);
      return;
    }
    animatePresetChange(() => setSelectedPreset(preset));
    setShowTrending(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isPro, showPaywall, animatePresetChange]);

  const toggleCamera = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const cameraSize = getCameraSize;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Camera ── */}
      <View style={[styles.cameraContainer, { backgroundColor: '#161616', justifyContent: 'center' }]}>
        <View style={styles.skeuoLeatherTexture} />
        
        <View style={[styles.viewfinderFrame, { width: cameraSize.width, height: cameraSize.height, alignSelf: 'center' }]}>
          <View style={{ flex: 1, overflow: 'hidden', borderRadius: 12, borderWidth: 4, borderColor: '#2E2E2E', position: 'relative' }}>
            {permission && !permission.granted && (
              <View style={styles.permissionBlockedContainer}>
                <CameraIcon size={44 * uiScale} color="#FFB800" />
                <Text style={[styles.permissionBlockedTitle, { fontSize: 16 * uiScale }]}>
                  {t('camera.permission_required', 'Camera Access Required')}
                </Text>
                <Text style={[styles.permissionBlockedSub, { fontSize: 11 * uiScale }]}>
                  {t('camera.permission_desc', 'RetroCam needs camera permission to capture vintage photos.')}
                </Text>
                <TouchableOpacity
                  style={styles.permissionEnableBtn}
                  onPress={() => {
                    if (permission.canAskAgain) {
                      requestPermission();
                    } else {
                      Linking.openSettings();
                    }
                  }}
                >
                  <Text style={styles.permissionEnableBtnText}>
                    {permission.canAskAgain
                      ? t('camera.enable_camera', 'Enable Camera')
                      : t('camera.open_settings', 'Open Settings')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isCameraActive && (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode="picture"
                flash={flashMode === 'torch' ? 'off' : flashMode}
                enableTorch={flashMode === 'torch'}
                zoom={zoom}
                autofocus={autofocus}
                pictureSize={pictureSize}
                onCameraReady={handleCameraReady}
                responsiveOrientationWhenOrientationLocked
              />
            )}

            {/* Real-time EV Exposure Compensation Viewfinder Simulation Overlay */}
            {ev !== 0 && (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: ev > 0 ? '#FFFFFF' : '#000000',
                    opacity: ev > 0
                      ? Math.min(0.45, (ev / 2.0) * 0.35)
                      : Math.min(0.65, (Math.abs(ev) / 2.0) * 0.5),
                  },
                ]}
              />
            )}

            {/* Double Exposure Viewfinder Overlay */}
            {doubleExposureFirstPhoto && (
              <Animated.Image
                source={{ uri: doubleExposureFirstPhoto }}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.4 }]}
                resizeMode="cover"
              />
            )}

            {/* Preset overlays — matched to FilteredImage Skia rendering */}
            {selectedPreset.settings.tintOpacity > 0 && (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedPreset.settings.tint, opacity: selectedPreset.settings.tintOpacity * 0.75 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.vignette > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.vignetteOverlay, { opacity: selectedPreset.settings.vignette * 0.9 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.lightLeak > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.lightLeakOverlay, { opacity: selectedPreset.settings.lightLeak * 0.4 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.grain > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.grainOverlay, { opacity: selectedPreset.settings.grain * 0.4 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.rgbShift > 0 && (
              <View style={[StyleSheet.absoluteFillObject]} pointerEvents="none">
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,100,50,0.06)', opacity: selectedPreset.settings.rgbShift * 0.5, transform: [{ translateX: selectedPreset.settings.rgbShift * 4 }] }]} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(50,150,255,0.06)', opacity: selectedPreset.settings.rgbShift * 0.5, transform: [{ translateX: -selectedPreset.settings.rgbShift * 4 }] }]} />
              </View>
            )}
            {selectedPreset.settings.halation > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.halationOverlay, { opacity: selectedPreset.settings.halation * 0.35 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.flash > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { opacity: selectedPreset.settings.flash * 0.25 }]} pointerEvents="none" />
            )}

            {/* Live VHS CRT Scanlines Simulation */}
            {(selectedPreset.frameType === 'vhs' || selectedPreset.cameraType === 'vhs' || selectedPreset.cameraType === 'camcorder') && (
              <View style={[StyleSheet.absoluteFillObject, styles.liveVhsOverlay]} pointerEvents="none">
                <View style={styles.liveVhsTrackingBar} />
              </View>
            )}

            {/* Live Fisheye Lens Barrel Vignette */}
            {(selectedLens === 'fisheye' || selectedPreset.frameType === 'fisheye') && (
              <View style={[StyleSheet.absoluteFillObject, styles.liveFisheyeOverlay]} pointerEvents="none" />
            )}

            {/* Active Lens Indicator in Viewfinder */}
            {selectedLens !== 'prime' && (
              <View style={styles.viewfinderLensBadge} pointerEvents="none">
                <Text style={[styles.viewfinderLensText, { fontSize: 9 * uiScale }]}>
                  {selectedLens.toUpperCase()} LENS
                </Text>
              </View>
            )}

            {/* Tap-to-Focus & Pinch-to-Zoom Gesture Surface */}
            <View
              style={StyleSheet.absoluteFillObject}
              {...panResponder.panHandlers}
            />

            {/* Animated Tap-to-Focus Reticle Ring */}
            {focusPoint && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.focusReticle,
                  {
                    left: focusPoint.x - 30,
                    top: focusPoint.y - 30,
                    opacity: focusAnimOpacity,
                    transform: [{ scale: focusAnimScale }],
                  },
                ]}
              >
                <View style={styles.focusReticleBox}>
                  <View style={[styles.reticleCorner, styles.rcTL]} />
                  <View style={[styles.reticleCorner, styles.rcTR]} />
                  <View style={[styles.reticleCorner, styles.rcBL]} />
                  <View style={[styles.reticleCorner, styles.rcBR]} />
                  <View style={styles.reticlePip} />
                </View>
                <View style={styles.reticleSun}>
                  <SunMedium size={12} color="#FFB800" />
                </View>
              </Animated.View>
            )}

            {/* Focus Brackets & Grid Lines */}
            <View style={styles.viewfinderFocusOverlay} pointerEvents="none">
              {showGrid && (
                <>
                  <View style={styles.gridLineH1} />
                  <View style={styles.gridLineH2} />
                  <View style={styles.gridLineV1} />
                  <View style={styles.gridLineV2} />
                </>
              )}
              
              <View style={styles.focusBrackets}>
                <View style={[styles.focusBracket, styles.bracketTL]} />
                <View style={[styles.focusBracket, styles.bracketTR]} />
                <View style={[styles.focusBracket, styles.bracketBL]} />
                <View style={[styles.focusBracket, styles.bracketBR]} />
                <View style={styles.focusCenterDot} />
              </View>
            </View>

            {/* Vintage Viewfinder HUD Overlays (Requirement R6) */}
            <ViewfinderHud preset={selectedPreset} uiScale={uiScale} />

            {selectedPreset.settings.timestamp && (
              <Text style={styles.viewfinderTimestamp} pointerEvents="none">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </Text>
            )}

            {/* Self-Timer Visual Countdown Badge */}
            {countdown !== null && (
              <View style={styles.countdownOverlay} pointerEvents="none">
                <View style={styles.countdownBadge}>
                  <Text style={[styles.countdownText, { fontSize: 64 * uiScale }]}>{countdown}</Text>
                </View>
                <Text style={[styles.countdownSubtext, { fontSize: 10 * uiScale }]}>TAP SHUTTER TO CANCEL</Text>
              </View>
            )}

            {/* Floating Zoom Factor Pill & Quick Steps */}
            <View style={styles.zoomFactorPill}>
              <View style={styles.zoomCurrentBadge}>
                <Text style={[styles.zoomCurrentText, { fontSize: 10 * uiScale }]}>{(1 + zoom * 4).toFixed(1)}x</Text>
              </View>
              <TouchableOpacity
                style={[styles.zoomStepButton, zoom === 0 && styles.zoomStepButtonActive]}
                onPress={() => {
                  setZoom(0);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.zoomStepText, { fontSize: 10 * uiScale }, zoom === 0 && styles.zoomStepTextActive]}>1x</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.zoomStepButton, Math.abs(zoom - 0.25) < 0.02 && styles.zoomStepButtonActive]}
                onPress={() => {
                  setZoom(0.25);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.zoomStepText, { fontSize: 10 * uiScale }, Math.abs(zoom - 0.25) < 0.02 && styles.zoomStepTextActive]}>2x</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.zoomStepButton, zoom === 1 && styles.zoomStepButtonActive]}
                onPress={() => {
                  setZoom(1.0);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.zoomStepText, { fontSize: 10 * uiScale }, zoom === 1 && styles.zoomStepTextActive]}>5x</Text>
              </TouchableOpacity>
            </View>

            {/* Floating EV Quick Adjustment Panel */}
            {showEvControls && (
              <View style={styles.evSelectorPanel}>
                <TouchableOpacity
                  style={styles.evStepBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                  onPress={() => {
                    setEv((v) => Math.max(-2, +(v - 0.5).toFixed(1)));
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.evStepBtnText, { fontSize: 14 * uiScale }]}>-</Text>
                </TouchableOpacity>
                {[-2.0, -1.0, 0.0, 1.0, 2.0].map((step) => (
                  <TouchableOpacity
                    key={step}
                    style={[styles.evPill, ev === step && styles.evPillActive]}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                    onPress={() => {
                      setEv(step);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.evPillText, { fontSize: 9 * uiScale }, ev === step && styles.evPillTextActive]}>
                      {step === 0 ? '±0' : (step > 0 ? `+${step.toFixed(0)}` : step.toFixed(0))}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.evStepBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                  onPress={() => {
                    setEv((v) => Math.min(2, +(v + 0.5).toFixed(1)));
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.evStepBtnText, { fontSize: 14 * uiScale }]}>+</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mechanical Shutter Flash Feedback Overlay (Requirement R6) */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                styles.shutterFlashOverlay,
                { opacity: shutterFlashOpacity },
              ]}
            />

            {/* Double Exposure Indicator Banner */}
            {doubleExposureFirstPhoto && (
              <View style={styles.doubleExposureBanner}>
                <Text style={styles.doubleExposureBannerText}>EXPOSURE 1/2 - TAKE SECOND SHOT</Text>
                <TouchableOpacity style={styles.doubleExposureCancel} onPress={() => {
                  setDoubleExposureFirstPhoto(null);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                  <Text style={styles.doubleExposureCancelText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Top bar ── */}
        <View
          pointerEvents="box-none"
          style={[styles.topBar, { paddingTop: isTablet ? 20 : 10, paddingHorizontal: isTablet ? 32 : 16 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 * uiScale }}>
            {!isSnapMode && (
              <TouchableOpacity
                style={[styles.iconButton, { width: 40 * uiScale, height: 40 * uiScale, borderRadius: 20 * uiScale }]}
                onPress={() => router.push('/settings')}
              >
                <Settings size={20 * uiScale} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.iconButton,
                flashMode !== 'off' && styles.iconButtonActive,
                { width: 40 * uiScale, height: 40 * uiScale, borderRadius: 20 * uiScale },
              ]}
              onPress={cycleFlashMode}
            >
              {flashMode === 'off' && <ZapOff size={18 * uiScale} color="#FFFFFF" />}
              {flashMode === 'on' && <Zap size={18 * uiScale} color="#FFB800" />}
              {flashMode === 'auto' && (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16 * uiScale} color="#FFFFFF" />
                  <Text style={{ position: 'absolute', right: -6, bottom: -4, fontSize: 8 * uiScale, fontWeight: '900', color: '#FFB800' }}>A</Text>
                </View>
              )}
              {flashMode === 'torch' && <Flame size={18 * uiScale} color="#FF8C00" />}
            </TouchableOpacity>
          </View>

          <View style={styles.topBarCenter} pointerEvents="box-none">
            {!isPro ? (
              <TouchableOpacity style={styles.freePill} onPress={() => showPaywall()}>
                <Text style={styles.freeTextTag}>{t('common.free')}</Text>
                <Text style={styles.upgradeBtnText}>{t('settings.upgrade')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.dailyPill} onPress={handleDailyCamera}>
                <Sparkles size={13 * uiScale} color="#FFB800" />
                <Text style={[styles.dailyText, { fontSize: 12 * uiScale }]}>{t('common.daily')}</Text>
              </TouchableOpacity>
            )}
            
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.controlsScrollView}
              contentContainerStyle={styles.controlsRow}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <TouchableOpacity style={styles.controlBtn} onPress={toggleAspectRatio}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale }]}>{aspectRatio === 'full' ? 'FULL' : aspectRatio}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, showGrid && styles.controlBtnActive]} onPress={toggleGrid}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale, color: showGrid ? '#FFB800' : '#FFF' }]}>GRID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, timerSeconds > 0 && styles.controlBtnActive]} onPress={cycleTimer}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale, color: timerSeconds > 0 ? '#FFB800' : '#FFF' }]}>
                  {timerSeconds === 0 ? 'TIMER' : `${timerSeconds}S`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, ev !== 0 && styles.controlBtnActive]} onPress={() => setShowEvControls((v) => !v)}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale, color: ev !== 0 ? '#FFB800' : '#FFF' }]}>
                  {ev === 0 ? 'EV ±0' : (ev > 0 ? `EV +${ev.toFixed(1)}` : `EV ${ev.toFixed(1)}`)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, selectedLens !== 'prime' && styles.controlBtnActive]}
                onPress={() => {
                  setShowLensPicker((v) => !v);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale, color: selectedLens !== 'prime' ? '#FFB800' : '#FFF' }]}>
                  {selectedLens === 'prime' ? 'LENS' : selectedLens.toUpperCase()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, isDoubleExposureMode && styles.controlBtnActive]} onPress={() => {
                setIsDoubleExposureMode(!isDoubleExposureMode);
                setDoubleExposureFirstPhoto(null);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale, color: isDoubleExposureMode ? '#FFB800' : '#FFF' }]}>DBL EXP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, isSnapMode && styles.controlBtnActive]} onPress={toggleSnapMode}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale }]}>SNAP</Text>
              </TouchableOpacity>
            </GHScrollView>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 * uiScale }}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                isMuted && styles.iconButtonActive,
                { width: 40 * uiScale, height: 40 * uiScale, borderRadius: 20 * uiScale },
              ]}
              onPress={toggleMute}
            >
              {isMuted ? (
                <VolumeX size={18 * uiScale} color="#FF453A" />
              ) : (
                <Volume2 size={18 * uiScale} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { width: 40 * uiScale, height: 40 * uiScale, borderRadius: 20 * uiScale }]}
              onPress={toggleCamera}
            >
              <FlipHorizontal size={20 * uiScale} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Preset name overlay (big, centered) ── */}
        {!isSnapMode && (
          <View style={styles.presetNameContainer} pointerEvents="none">
            <Animated.View style={{ opacity: nameOpacity, transform: [{ translateY: nameTranslateY }], alignItems: 'center' }}>
              <Text style={[styles.cameraTypeLabel, { fontSize: 11 * uiScale }]}>
                {CAMERA_TYPE_ICONS[selectedPreset.cameraType]}  {CAMERA_TYPE_LABELS[selectedPreset.cameraType]}
              </Text>
              <Text style={[styles.presetNameBig, { fontSize: 22 * uiScale }]}>{selectedPreset.name}</Text>
              {selectedPreset.filmStock && (
                <Text style={[styles.filmStockLabel, { fontSize: 11 * uiScale }]}>{selectedPreset.filmStock}</Text>
              )}
              <Text style={[styles.presetDesc, { fontSize: 12 * uiScale }]}>{selectedPreset.description}</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* ── Bottom panel ── */}
      <View style={[styles.bottomContainer, { paddingBottom: Platform.OS === 'ios' ? (isTablet ? 32 : 24) : 16 }]}>

        {/* Trending panel */}
         {showTrending && (
          <View style={styles.trendingPanel}>
            <Text style={styles.trendingTitle}>🔥 {t('common.trending')}</Text>
            <GHScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ width: '100%' }}
              contentContainerStyle={styles.trendingList}
            >
              {trendingPresets.map((preset, index) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.trendingItem, selectedPreset.id === preset.id && styles.trendingItemActive, { marginRight: index !== trendingPresets.length - 1 ? 6 : 0 }]}
                  onPress={() => handleTrendingSelect(preset)}
                >
                  <View style={[styles.trendingDot, { backgroundColor: preset.color }]} />
                  <Text style={styles.trendingName} numberOfLines={1}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </GHScrollView>
          </View>
        )}

        {/* Category filter bar */}
        {!isSnapMode && (
          <View style={styles.categoryBarWrapper}>
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={styles.categoryList}
            >
               {categories.map((cat, index) => {
                const isActive = activeCategory === cat;
                const icon = cat === 'all' ? '🎞' : CAMERA_TYPE_ICONS[cat as CamType];
                const label = cat === 'all' ? t('common.all') : t(`camera_types.${cat}`);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill, 
                      isActive && styles.categoryPillActive, 
                      { 
                        paddingHorizontal: 10 * uiScale, 
                        paddingVertical: 5 * uiScale,
                        marginRight: index !== categories.length - 1 ? 6 : 0 
                      }
                    ]}
                    onPress={() => {
                      setActiveCategory(cat);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.categoryIcon, { fontSize: 12 * uiScale }]}>{icon}</Text>
                    <Text style={[styles.categoryLabel, { fontSize: 11 * uiScale }, isActive && styles.categoryLabelActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </GHScrollView>
          </View>
        )}

        {/* Lens selection panel (Interchangeable Lenses Menu) */}
        {showLensPicker && (
          <View style={styles.lensPickerPanel}>
            <View style={styles.lensPickerHeader}>
              <Text style={[styles.lensPickerTitle, { fontSize: 11 * uiScale }]}>OPTICAL LENSES</Text>
              <TouchableOpacity
                onPress={() => setShowLensPicker(false)}
                style={styles.lensPickerClose}
              >
                <Text style={[styles.lensPickerCloseText, { fontSize: 10 * uiScale }]}>DONE</Text>
              </TouchableOpacity>
            </View>
            <GHScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={styles.lensList}
            >
              {CAMERA_LENSES.map((lensItem) => {
                const isSelected = selectedLens === lensItem.id;
                const lensIcon = lensItem.id === 'prime' ? '⭕' : lensItem.id === 'fisheye' ? '🐟' : lensItem.id === 'prism' ? '💎' : lensItem.id === 'star' ? '✨' : '🔭';
                return (
                  <TouchableOpacity
                    key={lensItem.id}
                    style={[
                      styles.lensCard,
                      isSelected && styles.lensCardActive,
                      { paddingHorizontal: 12 * uiScale, paddingVertical: 8 * uiScale }
                    ]}
                    onPress={() => {
                      setSelectedLens(lensItem.id);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <View style={styles.lensCardHeader}>
                      <Text style={[styles.lensIcon, { fontSize: 14 * uiScale }]}>{lensIcon}</Text>
                      <Text style={[styles.lensName, { fontSize: 11 * uiScale }, isSelected && styles.lensNameActive]}>
                        {lensItem.name}
                      </Text>
                    </View>
                    <Text style={[styles.lensTagline, { fontSize: 9 * uiScale }]}>
                      {lensItem.tagline}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </GHScrollView>
          </View>
        )}

        {/* Camera carousel */}
        <CameraCarousel
          presets={filteredPresets}
          selectedId={selectedPreset.id}
          onSelect={handlePresetSelect}
          isPro={isPro}
        />

        {/* Shutter row */}
        <View style={[styles.shutterRow, { paddingHorizontal: isTablet ? 60 : 20 }]}>
          {/* Left actions */}
           <View style={[styles.sideActions, { width: 110 * uiScale, gap: 16 * uiScale }]}>
            <TouchableOpacity style={styles.sideButton} onPress={handleGalleryImport}>
              <ImageIcon size={22 * uiScale} color="#FFFFFF" />
              <Text style={[styles.sideLabel, { fontSize: 10 * uiScale }]}>{t('common.import')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={() => router.push({ pathname: '/video', params: { presetId: selectedPreset.id } })}
            >
              <Video size={22 * uiScale} color="#FFFFFF" />
              <Text style={[styles.sideLabel, { fontSize: 10 * uiScale }]}>{t('common.video')}</Text>
            </TouchableOpacity>
          </View>

          {/* Shutter */}
          <View style={styles.shutterWrap}>
            <ShutterButton onPress={handleCapture} disabled={isCapturing} scale={uiScale} />
            {isCapturing && <ActivityIndicator style={styles.captureSpinner} color="#FFB800" size="large" />}
          </View>

          {/* Right actions */}
           <View style={[styles.sideActions, { width: 110 * uiScale, gap: 16 * uiScale }]}>
            <TouchableOpacity style={styles.sideButton} onPress={handleRandomCamera}>
              <View style={styles.iconWithBadge}>
                <RefreshCw size={22 * uiScale} color="#FFFFFF" />
                {!isPro && <Lock size={10 * uiScale} color="#FFB800" style={styles.lockBadge} />}
              </View>
              <Text style={[styles.sideLabel, { fontSize: 10 * uiScale }]}>{t('common.random')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={() => {
                if (!isPro) {
                  showPaywall();
                } else {
                  setShowTrending((v) => !v);
                }
              }}
            >
              <View style={styles.iconWithBadge}>
                <TrendingUp size={22 * uiScale} color={showTrending ? '#FFB800' : '#FFFFFF'} />
                {!isPro && <Lock size={10 * uiScale} color="#FFB800" style={styles.lockBadge} />}
              </View>
              <Text style={[styles.sideLabel, { fontSize: 10 * uiScale }, showTrending && styles.activeSideLabel]}>{t('common.trending')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Camera
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { position: 'absolute' },
  vignetteOverlay: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  lightLeakOverlay: {
    backgroundColor: 'transparent',
    shadowColor: '#FF8C00',
    shadowOffset: { width: -30, height: -30 },
    shadowOpacity: 1,
    shadowRadius: 120,
  },
  grainOverlay: {
    backgroundColor: 'rgba(140,130,120,0.18)',
  },
  halationOverlay: {
    backgroundColor: 'transparent',
    shadowColor: '#FF3C00',
    shadowOffset: { width: 0, height: -40 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  flashOverlay: {
    backgroundColor: 'rgba(255,255,240,0.25)',
  },
  liveVhsOverlay: {
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  liveVhsTrackingBar: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  liveFisheyeOverlay: {
    borderRadius: 999,
    borderWidth: 24,
    borderColor: 'rgba(0,0,0,0.75)',
    margin: -10,
  },
  viewfinderLensBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E8A838',
  },
  viewfinderLensText: {
    color: '#E8A838',
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timestamp: {
    position: 'absolute',
    color: 'rgba(255,180,50,0.9)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  skeuoLeatherTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C1C1E',
    opacity: 0.95,
  },
  viewfinderFrame: {
    backgroundColor: '#0E0E0E',
    padding: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  viewfinderFocusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineH1: { position: 'absolute', top: '33.3%', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  gridLineH2: { position: 'absolute', top: '66.6%', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  gridLineV1: { position: 'absolute', left: '33.3%', top: 0, bottom: 0, width: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  gridLineV2: { position: 'absolute', left: '66.6%', top: 0, bottom: 0, width: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' },
  focusBrackets: {
    width: 64,
    height: 64,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBracket: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: 'rgba(255,184,0,0.6)',
  },
  bracketTL: { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  bracketTR: { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bracketBL: { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  bracketBR: { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  focusCenterDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,184,0,0.6)' },
  viewfinderTimestamp: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    color: 'rgba(255,180,50,0.85)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  doubleExposureBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.35)',
  },
  doubleExposureBannerText: {
    color: '#FFB800',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doubleExposureCancel: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  doubleExposureCancelText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    elevation: 40,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255,184,0,0.18)',
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  focusReticle: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  focusReticleBox: {
    width: 48,
    height: 48,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleCorner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: '#FFB800',
  },
  rcTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  rcTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  rcBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  rcBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  reticlePip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFB800',
  },
  reticleSun: {
    position: 'absolute',
    right: -12,
    top: '50%',
    marginTop: -6,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  countdownBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 3,
    borderColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  countdownSubtext: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.4)',
  },
  zoomFactorPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 25,
  },
  zoomCurrentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,184,0,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.5)',
  },
  zoomCurrentText: {
    color: '#FFB800',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace',
  },
  zoomStepButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  zoomStepButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  zoomStepText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  zoomStepTextActive: {
    color: '#FFFFFF',
  },
  evSelectorPanel: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#FFB800',
    zIndex: 50,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  evStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  evStepBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  evPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  evPillActive: {
    backgroundColor: '#FFB800',
  },
  evPillText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },
  evPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  dailyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
  },
  dailyText: { color: '#FFB800', fontWeight: '700' },
  topBarCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    zIndex: 101,
    elevation: 41,
  },
  controlsScrollView: {
    maxWidth: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  controlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlBtnActive: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255,184,0,0.1)',
  },
  controlBtnText: {
    color: '#FFF',
    fontWeight: '800',
  },

  // Preset name overlay
  presetNameContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraTypeLabel: {
    color: 'rgba(255,184,0,0.85)',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  filmStockLabel: {
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  presetNameBig: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  presetDesc: {
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom
  bottomContainer: {
    backgroundColor: '#000',
  },

  // Trending
  trendingPanel: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  trendingTitle: {
    color: '#FFB800',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  trendingList: { 
    paddingHorizontal: 12, 
    flexGrow: 0, 
    flexDirection: 'row' 
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trendingItemActive: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255,184,0,0.1)',
  },
  trendingDot: { width: 8, height: 8, borderRadius: 4 },
  trendingName: { color: '#FFF', fontSize: 12, fontWeight: '500', maxWidth: 90 },

  // Shutter row
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sideActions: {
    flexDirection: 'row',
  },
  sideButton: { alignItems: 'center', gap: 3 },
  sideLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  activeSideLabel: { color: '#FFB800' },
  shutterWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  captureSpinner: { position: 'absolute' },

  // Category bar
  categoryBarWrapper: {
    marginBottom: 8,
    width: '100%',
  },
  categoryFlatList: {
    width: '100%',
  },
  categoryList: { 
    paddingHorizontal: 12, 
    paddingVertical: 8,
    flexGrow: 0,
    flexDirection: 'row',
  },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderColor: '#FFB800',
  },
  categoryIcon: { },
  categoryLabel: { color: '#666', fontWeight: '500' },
  categoryLabelActive: { color: '#FFB800', fontWeight: '700' },

  // Free Tag Styles
  freePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  freeTextTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
   upgradeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 1,
  },

  // ── Shutter Flash Overlay (Requirement R6) ──
  shutterFlashOverlay: {
    backgroundColor: '#FFFFFF',
    zIndex: 50,
  },

  // ── Vintage HUD Overlays (Requirement R6) ──
  hudTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Camcorder
  hudRecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudRecDot: {
    backgroundColor: '#FF3B30',
  },
  hudRecText: {
    color: '#FF3B30',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hudCamcorderFormat: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hudBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBatteryBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 1.5,
    gap: 1.5,
  },
  hudBatterySegment: {
    backgroundColor: '#4CD964',
    borderRadius: 0.5,
  },
  hudBatteryNub: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    marginLeft: 1,
  },
  hudTimecode: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hudZoomTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudZoomLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  hudZoomLine: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  hudZoomIndicator: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    top: -2,
  },
  // Digicam
  hudDigitalAuto: {
    color: '#00FF66',
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hudDigitalQuality: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  hudDigitalBatteryBox: {
    borderWidth: 1.2,
    borderColor: '#00FF66',
    borderRadius: 2,
    padding: 1,
    justifyContent: 'center',
  },
  hudDigitalBatteryFill: {
    height: '100%',
    backgroundColor: '#00FF66',
    borderRadius: 1,
  },
  hudDigitalBatteryNub: {
    backgroundColor: '#00FF66',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    marginLeft: 1,
  },
  hudDigitalCenterBox: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudDigitalAfTarget: {
    borderWidth: 1,
    borderColor: 'rgba(0,255,102,0.4)',
    borderRadius: 4,
  },
  hudDigitalIso: {
    color: '#00FF66',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hudDigitalStorage: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // 35mm / Disposable
  hudReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  hudReadyLed: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  hudReadyText: {
    color: '#34C759',
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hudFrameCounterBadge: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  hudFrameCounterText: {
    color: '#FFB800',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  // Half-frame
  hudHalfFrameSplitLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1.5,
    marginLeft: -0.75,
    backgroundColor: 'rgba(255,184,0,0.5)',
  },
  hudHalfFrameBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
  },
  hudHalfFrameBadgeText: {
    color: '#FFB800',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hudHalfFrameCenterMarker: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hudHalfFrameCenterDot: {
    backgroundColor: '#FFB800',
    opacity: 0.7,
  },
  // Lens Picker
  lensPickerPanel: {
    backgroundColor: '#161618',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2A2A2C',
    paddingVertical: 10,
    marginBottom: 8,
  },
  lensPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lensPickerTitle: {
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 1,
  },
  lensPickerClose: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
  },
  lensPickerCloseText: {
    color: '#FFB800',
    fontWeight: '700',
  },
  lensList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  lensCard: {
    backgroundColor: '#202022',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E32',
    minWidth: 110,
  },
  lensCardActive: {
    borderColor: '#FFB800',
    backgroundColor: '#2A2415',
  },
  lensCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  lensIcon: {},
  lensName: {
    color: '#E5E5EA',
    fontWeight: '700',
  },
  lensNameActive: {
    color: '#FFB800',
  },
  lensTagline: {
    color: '#8E8E93',
  },
  permissionBlockedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 40,
    elevation: 25,
  },
  permissionBlockedTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionBlockedSub: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
  },
  permissionEnableBtn: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionEnableBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
});
