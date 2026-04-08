import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
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
} from 'lucide-react-native';
import { CameraCarousel } from '@/components/CameraCarousel';
import { ShutterButton } from '@/components/ShutterButton';
import { CameraPreset, CameraType as CamType, CAMERA_PRESETS, CAMERA_TYPE_ICONS, CAMERA_TYPE_LABELS } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { useTrending } from '@/hooks/useTrending';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

 export default function CameraScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [selectedPreset, setSelectedPreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CamType | 'all'>('all');
  const cameraRef = useRef<CameraView>(null);
  const { isPro, showPaywall } = usePurchases();
  const trendingPresets = useTrending();
  
  const [aspectRatio, setAspectRatio] = useState<'full' | '1:1' | '3:2' | '4:5'>('full');
  const [isSnapMode, setIsSnapMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => setIsCameraActive(true), 300);
      return () => {
        clearTimeout(t);
        setIsCameraActive(false);
      };
    }, [])
  );

  // Preset name fade animation
  const nameOpacity = useRef(new Animated.Value(1)).current;
  const nameTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Permission is handled during onboarding
  }, [permission, requestPermission]);

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
    switch (aspectRatio) {
      case '1:1': return { width: SCREEN_WIDTH, height: SCREEN_WIDTH };
      case '3:2': return { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.5 };
      case '4:5': return { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.25 };
      default: return { width: SCREEN_WIDTH, height: SCREEN_WIDTH * (16 / 9) }; // approximate full
    }
  }, [aspectRatio]);

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

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (photo) {
        router.push({
          pathname: '/preview',
          params: { uri: photo.uri, presetId: selectedPreset.id },
        });
      }
    } catch (error) {
      console.error('Capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, selectedPreset]);

  const handleGalleryImport = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 });
      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/preview',
          params: { uri: result.assets[0].uri, presetId: selectedPreset.id, isImport: 'true' },
        });
      }
    } catch (error) {
      console.error('Gallery import error:', error);
    }
  }, [selectedPreset]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Camera ── */}
      <View style={[styles.cameraContainer, { backgroundColor: '#000', justifyContent: 'center' }]}>
        <View style={{ width: getCameraSize.width, height: getCameraSize.height, overflow: 'hidden', alignSelf: 'center' }}>
          {isCameraActive && (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mode="picture"
              responsiveOrientationWhenOrientationLocked
            />
          )}
        </View>

        {/* Preset overlays — absolute over camera, NOT inside CameraView */}
        {selectedPreset.settings.tintOpacity > 0 && (
          <View style={[styles.overlay, { backgroundColor: selectedPreset.settings.tint, opacity: selectedPreset.settings.tintOpacity }]} />
        )}
        {selectedPreset.settings.vignette > 0 && (
          <View style={[styles.vignetteOverlay, { opacity: selectedPreset.settings.vignette * 0.85 }]} />
        )}
        {selectedPreset.settings.lightLeak > 0 && (
          <View style={[styles.lightLeakOverlay, { opacity: selectedPreset.settings.lightLeak * 0.45 }]} />
        )}
        {selectedPreset.settings.grain > 0 && (
          <View style={[styles.grainOverlay, { opacity: selectedPreset.settings.grain * 0.2 }]} />
        )}
        {selectedPreset.settings.timestamp && (
          <Text style={styles.timestamp}>
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </Text>
        )}

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          {!isSnapMode && (
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
              <Settings size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <View style={styles.topBarCenter}>
            {!isPro ? (
              <TouchableOpacity style={styles.freePill} onPress={() => showPaywall()}>
                <Text style={styles.freeTextTag}>{t('common.free')}</Text>
                <Text style={styles.upgradeBtnText}>{t('settings.upgrade')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.dailyPill} onPress={handleDailyCamera}>
                <Sparkles size={13} color="#FFB800" />
                <Text style={styles.dailyText}>{t('common.daily')}</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={toggleAspectRatio}>
                <Text style={styles.controlBtnText}>{aspectRatio === 'full' ? 'FULL' : aspectRatio}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, isSnapMode && styles.controlBtnActive]} onPress={toggleSnapMode}>
                <Text style={styles.controlBtnText}>SNAP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
            <FlipHorizontal size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Preset name overlay (big, centered) ── */}
        {!isSnapMode && (
          <View style={styles.presetNameContainer} pointerEvents="none">
            <Animated.View style={{ opacity: nameOpacity, transform: [{ translateY: nameTranslateY }], alignItems: 'center' }}>
              <Text style={styles.cameraTypeLabel}>
                {CAMERA_TYPE_ICONS[selectedPreset.cameraType]}  {CAMERA_TYPE_LABELS[selectedPreset.cameraType]}
              </Text>
              <Text style={styles.presetNameBig}>{selectedPreset.name}</Text>
              {selectedPreset.filmStock && (
                <Text style={styles.filmStockLabel}>{selectedPreset.filmStock}</Text>
              )}
              <Text style={styles.presetDesc}>{selectedPreset.description}</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* ── Bottom panel ── */}
      <View style={styles.bottomContainer}>

        {/* Trending panel */}
         {showTrending && (
          <View style={styles.trendingPanel}>
            <Text style={styles.trendingTitle}>🔥 {t('common.trending')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
              {trendingPresets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.trendingItem, selectedPreset.id === preset.id && styles.trendingItemActive]}
                  onPress={() => handleTrendingSelect(preset)}
                >
                  <View style={[styles.trendingDot, { backgroundColor: preset.color }]} />
                  <Text style={styles.trendingName} numberOfLines={1}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category filter bar */}
        {!isSnapMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            style={styles.categoryBar}
          >
             {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const icon = cat === 'all' ? '🎞' : CAMERA_TYPE_ICONS[cat as CamType];
              const label = cat === 'all' ? t('common.all') : t(`camera_types.${cat}`);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => {
                    setActiveCategory(cat);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Camera carousel */}
        <CameraCarousel
          presets={filteredPresets}
          selectedId={selectedPreset.id}
          onSelect={handlePresetSelect}
          isPro={isPro}
        />

        {/* Shutter row */}
        <View style={styles.shutterRow}>
          {/* Left actions */}
           <View style={styles.sideActions}>
            <TouchableOpacity style={styles.sideButton} onPress={handleGalleryImport}>
              <ImageIcon size={22} color="#FFFFFF" />
              <Text style={styles.sideLabel}>{t('common.import')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideButton} onPress={() => router.push('/video')}>
              <Video size={22} color="#FFFFFF" />
              <Text style={styles.sideLabel}>{t('common.video')}</Text>
            </TouchableOpacity>
          </View>

          {/* Shutter */}
          <View style={styles.shutterWrap}>
            <ShutterButton onPress={handleCapture} disabled={isCapturing} />
            {isCapturing && <ActivityIndicator style={styles.captureSpinner} color="#FFB800" size="large" />}
          </View>

          {/* Right actions */}
           <View style={styles.sideActions}>
            <TouchableOpacity style={styles.sideButton} onPress={handleRandomCamera}>
              <View style={styles.iconWithBadge}>
                <RefreshCw size={22} color="#FFFFFF" />
                {!isPro && <Lock size={10} color="#FFB800" style={styles.lockBadge} />}
              </View>
              <Text style={styles.sideLabel}>{t('common.random')}</Text>
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
                <TrendingUp size={22} color={showTrending ? '#FFB800' : '#FFFFFF'} />
                {!isPro && <Lock size={10} color="#FFB800" style={styles.lockBadge} />}
              </View>
              <Text style={[styles.sideLabel, showTrending && styles.activeSideLabel]}>{t('common.trending')}</Text>
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
  overlay: { ...StyleSheet.absoluteFillObject },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  lightLeakOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    shadowColor: '#FF8C00',
    shadowOffset: { width: -30, height: -30 },
    shadowOpacity: 1,
    shadowRadius: 120,
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(140,130,120,0.18)',
  },
  timestamp: {
    position: 'absolute',
    bottom: 80,
    right: 18,
    color: 'rgba(255,180,50,0.9)',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
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
  dailyText: { color: '#FFB800', fontSize: 12, fontWeight: '700' },
  topBarCenter: { alignItems: 'center', gap: 10 },
  controlsRow: { flexDirection: 'row', gap: 8 },
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
    fontSize: 10,
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
  packLabel: {
    color: 'rgba(255,184,0,0.8)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cameraTypeLabel: {
    color: 'rgba(255,184,0,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  filmStockLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  presetNameBig: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  presetDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Bottom
  bottomContainer: {
    backgroundColor: '#000',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
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
  trendingList: { paddingHorizontal: 12, gap: 6 },
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sideActions: {
    flexDirection: 'row',
    gap: 16,
    width: 110,
  },
  sideButton: { alignItems: 'center', gap: 3 },
  sideLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500' },
  activeSideLabel: { color: '#FFB800' },
  shutterWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  captureSpinner: { position: 'absolute' },

  // Category bar
  categoryBar: { maxHeight: 36 },
  categoryList: { paddingHorizontal: 12, gap: 6, alignItems: 'center', paddingVertical: 4 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderColor: '#FFB800',
  },
  categoryIcon: { fontSize: 12 },
  categoryLabel: { color: '#666', fontSize: 11, fontWeight: '500' },
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
});
