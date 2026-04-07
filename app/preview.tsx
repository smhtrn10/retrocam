import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { X, Download, Share2, SplitSquareHorizontal } from 'lucide-react-native';
import { CAMERA_PRESETS, CameraPreset } from '@/constants/presets';
import { usePurchases } from '@/hooks/usePurchases';
import { isPresetLocked } from '@/utils/presets';
import { FilteredImage } from '@/components/FilteredImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.65;

export default function PreviewScreen() {
  const { uri, presetId } = useLocalSearchParams<{ uri: string; presetId: string }>();
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isPro, showPaywall } = usePurchases();
  const [isEditing, setIsEditing] = useState(false);
  const [overrides, setOverrides] = useState<Partial<CameraPreset['settings']>>({});
  const toggleAnim = useRef(new Animated.Value(0)).current;

  const preset = useMemo(
    () => CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0],
    [presetId]
  );
  const isLocked = isPresetLocked(preset, isPro);
  const showWatermark = !isPro;

  const handleClose = useCallback(() => router.back(), []);

  const toggleOriginal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !showOriginal;
    setShowOriginal(next);
    Animated.timing(toggleAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showOriginal, toggleAnim]);

  const handleSave = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    setIsSaving(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let saved = false;
      const filename = `retrocam_${Date.now()}.jpg`;
      const localUri = (FileSystem.documentDirectory ?? '') + filename;
      await FileSystem.copyAsync({ from: uri, to: localUri });

      try {
        // 1. Try direct saving (works on iOS and some Android versions without prompt)
        await MediaLibrary.saveToLibraryAsync(localUri);
        saved = true;
      } catch (e) {
        try {
          // 2. Try with explicit permission request
          const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo', 'video']);
          if (status === 'granted') {
            await MediaLibrary.saveToLibraryAsync(localUri);
            saved = true;
          }
        } catch (pe) {
          // Permission request failed or was rejected (common in Expo Go Android 13+)
          console.log('MediaLibrary permission rejected in Expo Go');
        }
      }

      if (saved) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Photo saved to your gallery');
      } else {
        // 3. Final fallback to Sharing (opens system menu with "Save to device" option)
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { dialogTitle: 'Save your photo' });
        } else {
          Alert.alert('Error', 'Could not save photo.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save photo');
    } finally {
      setIsSaving(false);
    }
  }, [isLocked, preset.id, showPaywall, uri]);

  const handleShare = useCallback(async () => {
    if (isLocked) { showPaywall(preset.id); return; }
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg' });
      }
    } catch (e) { /* noop */ }
  }, [isLocked, preset.id, showPaywall, uri]);

  const packLabel = preset.pack
    ? ({ japan: '🇯🇵 Japan Pack', vhs: '📼 VHS Pack', film: '🎞 Film Pack', cine: '🎬 Cine Pack', digital: '💾 Digital Pack' } as Record<string, string>)[preset.pack]
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <X size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {packLabel && <Text style={styles.packLabel}>{packLabel}</Text>}
          <Text style={styles.presetName}>{preset.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={[styles.iconButton, isEditing && styles.iconButtonActive]}
        >
          <Text style={{ color: isEditing ? '#000' : '#FFF', fontWeight: '800', fontSize: 10 }}>EDIT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleOriginal}
          style={[styles.iconButton, showOriginal && styles.iconButtonActive]}
        >
          <SplitSquareHorizontal size={20} color={showOriginal ? '#000' : '#FFF'} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {showOriginal ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <FilteredImage
            uri={uri}
            preset={preset}
            width={SCREEN_WIDTH}
            height={IMAGE_HEIGHT}
            showWatermark={showWatermark}
            overrides={overrides}
          />
        )}

        {/* Before/After label */}
        <View style={styles.modeLabel}>
          <Text style={styles.modeLabelText}>{showOriginal ? 'ORIGINAL' : preset.name.toUpperCase()}</Text>
        </View>
      </View>

      {/* Preset info strip */}
      <View style={styles.infoStrip}>
        <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
        <Text style={styles.presetDesc}>{preset.description}</Text>
        {!isPro && <Text style={styles.watermarkNote}>RetroCam watermark</Text>}
      </View>

      {/* Edit Panel */}
      {isEditing && (
        <View style={styles.editPanel}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>GRAIN</Text>
            <View style={styles.sliderTrack}>
              <TouchableOpacity 
                style={[styles.sliderFill, { width: `${(overrides.grain ?? preset.settings.grain) * 100}%` }]} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => ({ ...prev, grain: Math.max(0, (overrides.grain ?? preset.settings.grain) - 0.1) }))} 
              />
              <TouchableOpacity 
                style={styles.sliderTouch} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => ({ ...prev, grain: Math.min(1, (overrides.grain ?? preset.settings.grain) + 0.1) }))} 
              />
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>VIGNETTE</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(overrides.vignette ?? preset.settings.vignette) * 100}%` }]} />
              <TouchableOpacity 
                style={styles.sliderTouch} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => ({ ...prev, vignette: ((overrides.vignette ?? preset.settings.vignette) + 0.2) % 1.2 }))} 
              />
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>DUST</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(overrides.dust ?? preset.settings.dust) * 100}%` }]} />
              <TouchableOpacity 
                style={styles.sliderTouch} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => ({ ...prev, dust: ((overrides.dust ?? preset.settings.dust) + 0.2) % 1.2 }))} 
              />
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>SOFT FOCUS</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(overrides.blur ?? preset.settings.blur) * 100}%` }]} />
              <TouchableOpacity 
                style={styles.sliderTouch} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => ({ ...prev, blur: ((overrides.blur ?? preset.settings.blur) + 0.2) % 1.2 }))} 
              />
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>WARMTH</Text>
            <View style={styles.sliderTrack}>
              {/* Normalize -1..1 to 0..1 for slider width */}
              <View style={[styles.sliderFill, { width: `${((overrides.temperature ?? preset.settings.temperature) + 1) / 2 * 100}%` }]} />
              <TouchableOpacity 
                style={styles.sliderTouch} 
                onPress={() => setOverrides((prev: Partial<CameraPreset['settings']>) => {
                  let next = (overrides.temperature ?? preset.settings.temperature) + 0.4;
                  if (next > 1) next = -1;
                  return { ...prev, temperature: next };
                })} 
              />
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={handleShare}
          disabled={isLocked}
        >
          <Share2 size={20} color="#FFF" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary, (isLocked || isSaving) && styles.actionBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving || isLocked}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconButtonActive: { backgroundColor: '#FFB800' },
  headerCenter: { alignItems: 'center' },
  packLabel: { color: 'rgba(255,184,0,0.8)', fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  presetName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  imageContainer: {
    height: IMAGE_HEIGHT,
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  modeLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeLabelText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetDesc: { color: '#666', fontSize: 12, flex: 1 },
  watermarkNote: { color: 'rgba(255,184,0,0.6)', fontSize: 10 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
  },
  actionBtnPrimary: { backgroundColor: '#FFB800' },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.1)' },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  editPanel: {
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
    width: 70,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#FFB800',
  },
  sliderTouch: {
    ...StyleSheet.absoluteFillObject,
  },
});
