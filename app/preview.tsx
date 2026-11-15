import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { X, Download, Share2, SplitSquareHorizontal, RotateCcw, Lock } from 'lucide-react-native';
import { CAMERA_PRESETS, CameraPreset } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { isPresetLocked } from '@/utils/presets';
import { FilteredImage, FilteredImageRef, AspectRatioType } from '@/components/FilteredImage';
import { useDevice } from '@/hooks/useDevice';
import { LensType } from '@/constants/lenses';

export type { AspectRatioType };

/**
 * Calculates aspect-fit preview dimensions within container bounds.
 */
export function calculatePreviewSize(
  aspectRatio: AspectRatioType,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let targetRatio: number;
  switch (aspectRatio) {
    case '1:1':
      targetRatio = 1;
      break;
    case '3:2':
      targetRatio = 2 / 3; // Portrait 35mm
      break;
    case '4:5':
      targetRatio = 4 / 5; // Portrait Instagram
      break;
    case 'full':
    default:
      targetRatio = maxW / maxH;
      break;
  }

  let width = maxW;
  let height = Math.round(width / targetRatio);

  if (height > maxH) {
    height = maxH;
    width = Math.round(height * targetRatio);
  }

  return { width, height };
}

type EditKey = 'grain' | 'vignette' | 'lightLeak' | 'dust' | 'blur' | 'temperature' | 'prism' | 'flash';

const EDIT_PARAMS: { key: EditKey; label: string; min: number; max: number }[] = [
  { key: 'grain',       label: 'GRAIN',      min: 0,  max: 1 },
  { key: 'vignette',    label: 'VIGNETTE',   min: 0,  max: 1 },
  { key: 'lightLeak',   label: 'LIGHT LEAK', min: 0,  max: 1 },
  { key: 'dust',        label: 'DUST',       min: 0,  max: 1 },
  { key: 'blur',        label: 'SOFT FOCUS', min: 0,  max: 1 },
  { key: 'temperature', label: 'WARMTH',     min: -1, max: 1 },
  { key: 'prism',       label: 'PRISM LENS', min: 0,  max: 1 },
  { key: 'flash',       label: 'FLASH GEL',  min: 0,  max: 1 },
];

function Slider({
  value, min, max, onChange,
}: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const trackRef = useRef<View>(null);
  const trackWidth = useRef(0);

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const newPct = Math.max(0, Math.min(1, x / (trackWidth.current || 1)));
        onChange(min + newPct * (max - min));
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const newPct = Math.max(0, Math.min(1, x / (trackWidth.current || 1)));
        onChange(min + newPct * (max - min));
      },
    })
  ).current;

  return (
    <View
      ref={trackRef}
      style={styles.sliderTrack}
      onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
      <View style={[styles.sliderThumb, { left: `${pct * 100}%` as any }]} />
    </View>
  );
}

export default function PreviewScreen() {
  const { uri, secondaryUri, presetId, aspectRatio, isImport, lens } = useLocalSearchParams<{
    uri: string;
    secondaryUri?: string;
    presetId: string;
    aspectRatio?: AspectRatioType;
    isImport?: string;
    lens?: LensType;
  }>();
  void isImport;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, isTablet, scale: uiScale } = useDevice();
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { isPro, showPaywall } = usePurchases();
  const [isEditing, setIsEditing] = useState(false);
  const [overrides, setOverrides] = useState<Partial<CameraPreset['settings']>>({});
  const filteredImageRef = useRef<FilteredImageRef>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const selectedAspectRatio: AspectRatioType = useMemo(() => {
    const ar = Array.isArray(aspectRatio) ? aspectRatio[0] : aspectRatio;
    if (ar === '1:1' || ar === '3:2' || ar === '4:5' || ar === 'full') {
      return ar;
    }
    return 'full';
  }, [aspectRatio]);

  const selectedLens: LensType = useMemo(() => {
    const l = Array.isArray(lens) ? lens[0] : lens;
    if (l === 'fisheye' || l === 'prism' || l === 'star' || l === 'wide') {
      return l;
    }
    return 'prime';
  }, [lens]);

  const maxContainerWidth = isTablet ? Math.min(SCREEN_WIDTH - 64, 800) : SCREEN_WIDTH;
  const maxContainerHeight = isTablet ? SCREEN_HEIGHT * 0.6 : SCREEN_HEIGHT * 0.55;

  const previewSize = useMemo(() => {
    return calculatePreviewSize(selectedAspectRatio, maxContainerWidth, maxContainerHeight);
  }, [selectedAspectRatio, maxContainerWidth, maxContainerHeight]);

  const initialPreset = useMemo(
    () => CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0],
    [presetId]
  );
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>(initialPreset);
  const preset = currentPreset;
  const isLocked = isPresetLocked(preset, isPro);
  const showWatermark = !isPro;

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

  const handleClose = useCallback(() => router.back(), []);

  const handleSave = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    setIsSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const filteredUri = await filteredImageRef.current?.capture() ?? uri;
      if (!isMounted.current) return;

      let saved = false;
      try {
        await MediaLibrary.saveToLibraryAsync(filteredUri);
        saved = true;
      } catch {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(filteredUri);
            saved = true;
          }
        } catch { /* noop */ }
      }
      
      if (isMounted.current) {
        if (saved) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Saved', 'Photo saved to your gallery');
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filteredUri, { dialogTitle: 'Save your photo' });
        } else {
          Alert.alert('Error', 'Could not save photo.');
        }
      }
    } catch {
      if (isMounted.current) Alert.alert('Error', 'Failed to save photo');
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [isLocked, preset.id, showPaywall, uri]);

  const handleShare = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    setIsSharing(true);
    try {
      const filteredUri = await filteredImageRef.current?.capture() ?? uri;
      if (isMounted.current && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filteredUri, { mimeType: 'image/jpeg' });
      }
    } catch { /* noop */ }
    finally { if (isMounted.current) setIsSharing(false); }
  }, [isLocked, preset.id, showPaywall, uri]);

  const packLabel = preset.pack
    ? ({ japan: '🇯🇵 Japan Pack', vhs: '📼 VHS Pack', film: '🎞 Film Pack', cine: '🎬 Cine Pack', digital: '💾 Digital Pack' } as Record<string, string>)[preset.pack]
    : null;

  const getValue = (key: EditKey) => {
    if (overrides[key] !== undefined) return overrides[key] as number;
    return (preset.settings[key] ?? 0) as number;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isTablet ? 32 : 16 }]}>
        <TouchableOpacity onPress={handleClose} style={[styles.iconButton, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}>
          <X size={22 * uiScale} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {packLabel && <Text style={[styles.packLabel, { fontSize: 10 * uiScale }]}>{packLabel}</Text>}
          <Text style={[styles.presetName, { fontSize: 16 * uiScale }]}>{preset.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setIsEditing(!isEditing); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.iconButton, isEditing && styles.iconButtonActive, { width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}
        >
          <Text style={{ color: isEditing ? '#000' : '#FFF', fontWeight: '800', fontSize: 10 * uiScale }}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setShowOriginal(v => !v); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.iconButton, showOriginal && styles.iconButtonActive, { marginLeft: 10, width: 44 * uiScale, height: 44 * uiScale, borderRadius: 22 * uiScale }]}
        >
          <SplitSquareHorizontal size={20 * uiScale} color={showOriginal ? '#000' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View
        style={[
          styles.imageContainer,
          {
            width: previewSize.width,
            height: previewSize.height,
            alignSelf: 'center',
            borderRadius: isTablet ? 12 : 8,
            overflow: 'hidden',
          },
        ]}
      >
        {showOriginal ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <FilteredImage
            ref={filteredImageRef}
            uri={uri}
            secondaryUri={secondaryUri}
            preset={preset}
            aspectRatio={selectedAspectRatio}
            width={previewSize.width}
            height={previewSize.height}
            showWatermark={showWatermark}
            overrides={overrides}
            lens={selectedLens}
          />
        )}
        <View style={styles.modeLabel}>
          <Text style={[styles.modeLabelText, { fontSize: 10 * uiScale }]}>{showOriginal ? 'ORIGINAL' : preset.name.toUpperCase()}</Text>
        </View>
      </View>

      {/* Scrollable bottom area */}
      <ScrollView
        style={styles.bottomScroll}
        contentContainerStyle={[styles.bottomContent, { paddingHorizontal: isTablet ? 32 : 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info strip */}
        <View style={styles.infoStrip}>
          <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
          <Text style={[styles.presetDesc, { fontSize: 12 * uiScale }]}>{preset.description}</Text>
          {selectedAspectRatio !== 'full' && (
            <View style={styles.aspectBadge}>
              <Text style={[styles.aspectBadgeText, { fontSize: 10 * uiScale }]}>{selectedAspectRatio}</Text>
            </View>
          )}
          {selectedLens !== 'prime' && (
            <View style={[styles.aspectBadge, { backgroundColor: '#2A1B05', borderColor: '#E8A838', borderWidth: 1 }]}>
              <Text style={[styles.aspectBadgeText, { fontSize: 10 * uiScale, color: '#E8A838' }]}>
                {selectedLens.toUpperCase()} LENS
              </Text>
            </View>
          )}
          {!isPro && <Text style={[styles.watermarkNote, { fontSize: 10 * uiScale }]}>RetroCam watermark</Text>}
        </View>

        {/* Horizontal Film / Filter Switcher */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Text style={[styles.filterSectionTitle, { fontSize: 11 * uiScale }]}>FILTERS & PRESETS</Text>
            <Text style={[styles.filterCountBadge, { fontSize: 10 * uiScale }]}>
              {displayedPresets.length} FILMS
            </Text>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContent}
            style={styles.categoryTabsScroll}
          >
            {[
              { id: 'all', label: 'ALL' },
              { id: '35mm', label: '35mm' },
              { id: 'vhs', label: 'VHS' },
              { id: 'instant', label: 'INSTANT' },
              { id: 'cine', label: 'CINE' },
              { id: 'digital-y2k', label: 'DIGITAL' },
              { id: 'bw', label: 'B&W' },
            ].map((cat) => {
              const isCatActive = filterCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTab, isCatActive && styles.catTabActive]}
                  onPress={() => {
                    setFilterCategory(cat.id);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.catTabText, isCatActive && styles.catTabTextActive, { fontSize: 10 * uiScale }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Horizontal Preset Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterListContent}
            style={styles.filterListScroll}
          >
            {displayedPresets.map((p) => {
              const isSelected = p.id === currentPreset.id;
              const locked = isPresetLocked(p, isPro);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.filterCard,
                    isSelected && styles.filterCardSelected,
                    { width: 74 * uiScale, marginRight: 8 * uiScale }
                  ]}
                  onPress={() => handleSelectPreset(p)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.filterThumbContainer, { height: 74 * uiScale }]}>
                    <Image source={{ uri }} style={styles.filterThumbImage} resizeMode="cover" />
                    {/* Color grading overlay swatch */}
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          backgroundColor: p.settings.tint || p.color,
                          opacity: 0.22,
                        },
                      ]}
                    />
                    {/* Lock Badge if Pro */}
                    {locked && (
                      <View style={styles.filterLockBadge}>
                        <Lock size={10 * uiScale} color="#FFF" />
                      </View>
                    )}
                    {/* Active Check Dot */}
                    {isSelected && (
                      <View style={styles.filterActiveCheck}>
                        <View style={styles.filterActiveDot} />
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
                  <View style={styles.filterTypeRow}>
                    <View style={[styles.filterColorPill, { backgroundColor: p.color }]} />
                    <Text style={[styles.filterTypeTag, { fontSize: 8 * uiScale }]} numberOfLines={1}>
                      {p.cameraType}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Edit Panel */}
        {isEditing && (
          <View style={styles.editPanel}>
            <View style={styles.editHeader}>
              <Text style={[styles.editTitle, { fontSize: 11 * uiScale }]}>ADJUST</Text>
              <View style={styles.editHeaderRight}>
                <TouchableOpacity
                  onPress={() => {
                    const currentTs = overrides.timestamp !== undefined ? overrides.timestamp : preset.settings.timestamp;
                    setOverrides(prev => ({ ...prev, timestamp: !currentTs }));
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.dateToggleBtn,
                    (overrides.timestamp !== undefined ? overrides.timestamp : preset.settings.timestamp) && styles.dateToggleBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateToggleText,
                      (overrides.timestamp !== undefined ? overrides.timestamp : preset.settings.timestamp) && styles.dateToggleTextActive,
                      { fontSize: 10 * uiScale },
                    ]}
                  >
                    DATE STAMP {(overrides.timestamp !== undefined ? overrides.timestamp : preset.settings.timestamp) ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setOverrides({}); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={styles.resetBtn}
                >
                  <RotateCcw size={14 * uiScale} color="#888" />
                  <Text style={[styles.resetText, { fontSize: 12 * uiScale }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {EDIT_PARAMS.map(({ key, label, min, max }) => (
              <View key={key} style={styles.sliderRow}>
                <Text style={[styles.sliderLabel, { fontSize: 10 * uiScale, width: 72 * uiScale }]}>{label}</Text>
                <Slider
                  value={getValue(key)}
                  min={min}
                  max={max}
                  onChange={(v) => setOverrides(prev => ({ ...prev, [key]: parseFloat(v.toFixed(2)) }))}
                />
                <Text style={[styles.sliderValue, { fontSize: 10 * uiScale, width: 28 * uiScale }]}>
                  {key === 'temperature'
                    ? (getValue(key) >= 0 ? `+${(getValue(key) * 100).toFixed(0)}` : (getValue(key) * 100).toFixed(0))
                    : (getValue(key) * 100).toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actions, { gap: isTablet ? 24 : 12 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary, (isLocked || isSharing) && styles.actionBtnDisabled, { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale }]}
            onPress={handleShare}
            disabled={isLocked || isSharing}
          >
            {isSharing ? <ActivityIndicator color="#FFF" size="small" /> : <Share2 size={20 * uiScale} color="#FFF" />}
            <Text style={[styles.actionBtnText, { fontSize: 15 * uiScale }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary, (isLocked || isSaving) && styles.actionBtnDisabled, { paddingVertical: 14 * uiScale, borderRadius: 28 * uiScale }]}
            onPress={handleSave}
            disabled={isSaving || isLocked}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Download size={20 * uiScale} color="#000" />
                <Text style={[styles.actionBtnText, { color: '#000', fontSize: 15 * uiScale }]}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center', alignItems: 'center',
  },
  iconButtonActive: { backgroundColor: '#FFB800' },
  headerCenter: { flex: 1, alignItems: 'center' },
  packLabel: { color: 'rgba(255,184,0,0.8)', fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  presetName: { color: '#FFF', fontWeight: '700' },
  imageContainer: {
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  modeLabel: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  modeLabelText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5 },

  bottomScroll: { flex: 1 },
  bottomContent: { paddingBottom: Platform.OS === 'ios' ? 8 : 16 },

  infoStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetDesc: { color: '#666', flex: 1 },
  aspectBadge: {
    backgroundColor: 'rgba(255,184,0,0.15)',
    borderColor: 'rgba(255,184,0,0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aspectBadgeText: {
    color: '#FFB800',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  watermarkNote: { color: 'rgba(255,184,0,0.6)' },

  editPanel: {
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  editHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dateToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dateToggleBtnActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.16)',
    borderColor: '#FFB800',
  },
  dateToggleText: {
    color: '#888',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateToggleTextActive: {
    color: '#FFB800',
  },
  editTitle: { color: '#FFB800', fontWeight: '800', letterSpacing: 1.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { color: '#888' },

  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { color: '#888', fontWeight: '700' },
  sliderTrack: {
    flex: 1, height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute', left: 0, top: 12,
    height: 4, backgroundColor: '#FFB800', borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute', top: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFB800',
    marginLeft: -8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 3,
    elevation: 4,
  },
  sliderValue: { color: '#666', textAlign: 'right' },

  actions: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  actionBtnPrimary: { backgroundColor: '#FFB800' },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#FFF', fontWeight: '600' },

  // Filter Switcher
  filterSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterSectionTitle: {
    color: '#FFB800',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  filterCountBadge: {
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  categoryTabsScroll: {
    marginBottom: 8,
  },
  categoryTabsContent: {
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
  filterListScroll: {
    paddingVertical: 2,
  },
  filterListContent: {
    paddingRight: 16,
  },
  filterCard: {
    alignItems: 'center',
    borderRadius: 8,
    padding: 3,
    backgroundColor: '#161618',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterCardSelected: {
    borderColor: '#FFB800',
    backgroundColor: '#201A0E',
  },
  filterThumbContainer: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0A0A0A',
    marginBottom: 4,
  },
  filterThumbImage: {
    width: '100%',
    height: '100%',
  },
  filterLockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    padding: 3,
  },
  filterActiveCheck: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFB800',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
  },
  filterName: {
    color: '#D1D1D6',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  filterNameSelected: {
    color: '#FFB800',
  },
  filterTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterColorPill: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  filterTypeTag: {
    color: '#636366',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
