import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Animated,
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
} from 'lucide-react-native';
import { CameraCarousel } from '@/components/CameraCarousel';
import { ShutterButton } from '@/components/ShutterButton';
import { CameraPreset, CameraType as CamType, CAMERA_PRESETS, CAMERA_TYPE_ICONS, CAMERA_TYPE_LABELS } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { useTrending } from '@/hooks/useTrending';
import { useDevice } from '@/hooks/useDevice';

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
  const { isPro, showPaywall } = usePurchases();
  const trendingPresets = useTrending();
  
  const [aspectRatio, setAspectRatio] = useState<'full' | '1:1' | '3:2' | '4:5'>('full');
  const [isSnapMode, setIsSnapMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [isDoubleExposureMode, setIsDoubleExposureMode] = useState(false);
  const [doubleExposureFirstPhoto, setDoubleExposureFirstPhoto] = useState<string | null>(null);

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

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
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
              params: { uri: photo.uri, secondaryUri: firstPhoto, presetId: selectedPreset.id },
            });
          }
        } else {
          router.push({
            pathname: '/preview',
            params: { uri: photo.uri, presetId: selectedPreset.id },
          });
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
    } finally {
      if (isMounted.current) setIsCapturing(false);
    }
  }, [isCapturing, selectedPreset, isDoubleExposureMode, doubleExposureFirstPhoto]);

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
            params: { uri: asset.uri, presetId: selectedPreset.id, isImport: 'true' },
          });
        }
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

  const cameraSize = getCameraSize;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Camera ── */}
      <View style={[styles.cameraContainer, { backgroundColor: '#161616', justifyContent: 'center' }]}>
        <View style={styles.skeuoLeatherTexture} />
        
        <View style={[styles.viewfinderFrame, { width: cameraSize.width, height: cameraSize.height, alignSelf: 'center' }]}>
          <View style={{ flex: 1, overflow: 'hidden', borderRadius: 12, borderWidth: 4, borderColor: '#2E2E2E', position: 'relative' }}>
            {isCameraActive && (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode="picture"
                responsiveOrientationWhenOrientationLocked
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
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedPreset.settings.tint, opacity: selectedPreset.settings.tintOpacity }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.vignette > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.vignetteOverlay, { opacity: selectedPreset.settings.vignette * 0.9 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.lightLeak > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.lightLeakOverlay, { opacity: selectedPreset.settings.lightLeak * 0.5 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.grain > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.grainOverlay, { opacity: selectedPreset.settings.grain * 0.55 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.rgbShift > 0 && (
              <View style={[StyleSheet.absoluteFillObject]} pointerEvents="none">
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,0,0,0.12)', opacity: selectedPreset.settings.rgbShift, transform: [{ translateX: selectedPreset.settings.rgbShift * 8 }] }]} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,255,0.12)', opacity: selectedPreset.settings.rgbShift, transform: [{ translateX: -selectedPreset.settings.rgbShift * 8 }] }]} />
              </View>
            )}
            {selectedPreset.settings.halation > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.halationOverlay, { opacity: selectedPreset.settings.halation * 0.45 }]} pointerEvents="none" />
            )}
            {selectedPreset.settings.flash > 0 && (
              <View style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { opacity: selectedPreset.settings.flash * 0.35 }]} pointerEvents="none" />
            )}

            {/* Focus Brackets & Grid Lines */}
            <View style={styles.viewfinderFocusOverlay} pointerEvents="none">
              <View style={styles.gridLineH1} />
              <View style={styles.gridLineH2} />
              <View style={styles.gridLineV1} />
              <View style={styles.gridLineV2} />
              
              <View style={styles.focusBrackets}>
                <View style={[styles.focusBracket, styles.bracketTL]} />
                <View style={[styles.focusBracket, styles.bracketTR]} />
                <View style={[styles.focusBracket, styles.bracketBL]} />
                <View style={[styles.focusBracket, styles.bracketBR]} />
                <View style={styles.focusCenterDot} />
              </View>
            </View>

            {selectedPreset.settings.timestamp && (
              <Text style={styles.viewfinderTimestamp} pointerEvents="none">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </Text>
            )}

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
        <View style={[styles.topBar, { paddingTop: isTablet ? 20 : 10, paddingHorizontal: isTablet ? 32 : 16 }]}>
          {!isSnapMode && (
            <TouchableOpacity style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]} onPress={() => router.push('/settings')}>
              <Settings size={22 * uiScale} color="#FFFFFF" />
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
                <Sparkles size={13 * uiScale} color="#FFB800" />
                <Text style={[styles.dailyText, { fontSize: 12 * uiScale }]}>{t('common.daily')}</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={toggleAspectRatio}>
                <Text style={[styles.controlBtnText, { fontSize: 10 * uiScale }]}>{aspectRatio === 'full' ? 'FULL' : aspectRatio}</Text>
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
            </View>
          </View>

          <TouchableOpacity style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]} onPress={toggleCamera}>
            <FlipHorizontal size={22 * uiScale} color="#FFFFFF" />
          </TouchableOpacity>
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
            <TouchableOpacity style={styles.sideButton} onPress={() => router.push('/video')}>
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
  },
  iconButton: {
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
  dailyText: { color: '#FFB800', fontWeight: '700' },
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
});
