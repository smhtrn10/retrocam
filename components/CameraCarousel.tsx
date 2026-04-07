import { useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CameraPreset } from '@/constants/presets';
import {
  KodakIcon, FujiIcon, PolaroidIcon, DisposableIcon, VHSIcon,
  HasselIcon, Super8Icon, Y2KIcon, OlympusPenIcon, LomoIcon,
  NoirIcon, GenericCamIcon,
} from '@/components/CameraIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 80;
const ITEM_HEIGHT = 100;
const SPACING = 12;
const FULL_ITEM = ITEM_WIDTH + SPACING;
const CENTER_OFFSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// HOT presets
const HOT_IDS = new Set([
  'disposable-flash', 'vhs-classic', 'y2k-digital', 'kodak-gold-200',
  'fuji-quicksnap', 'handycam-dcr', 'super8-kodachrome', 'fisheye-lomo',
]);

interface CameraCarouselProps {
  presets: CameraPreset[];
  selectedId: string;
  onSelect: (preset: CameraPreset) => void;
  isPro: boolean;
}

function getCameraIcon(preset: CameraPreset, size = 48) {
  const id = preset.id;
  const type = preset.cameraType;

  if (id.includes('kodak') && !id.includes('noir')) return <KodakIcon size={size} />;
  if (id.includes('fuji') || id.includes('velvia')) return <FujiIcon size={size} />;
  if (id.includes('polaroid') || id.includes('instax') || id.includes('kyoto')) return <PolaroidIcon size={size} />;
  if (type === 'disposable' || id.includes('disposable') || id.includes('funsaver') || id.includes('quicksnap') || id.includes('shibuya')) return <DisposableIcon size={size} />;
  if (type === 'vhs' || type === 'camcorder' || id.includes('vhs') || id.includes('handycam')) return <VHSIcon size={size} />;
  if (type === '120' || id.includes('hasselblad') || id.includes('mamiya') || id.includes('rollei')) return <HasselIcon size={size} />;
  if (type === '8mm' || type === '16mm' || id.includes('super8') || id.includes('regular8') || id.includes('cinema') || id.includes('nouvelle')) return <Super8Icon size={size} />;
  if (type === 'digital-y2k' || id.includes('sony') || id.includes('canon-ixus') || id.includes('nokia')) return <Y2KIcon size={size} />;
  if (type === 'half-frame' || id.includes('olympus') || id.includes('canon-demi')) return <OlympusPenIcon size={size} />;
  if (id.includes('lomo') || id.includes('fisheye')) return <LomoIcon size={size} />;
  if (id.includes('noir') || id.includes('ilford') || id.includes('rolleiflex') || id.includes('nouvelle')) return <NoirIcon size={size} />;

  return <GenericCamIcon size={size} color={preset.color} />;
}

// Short display name (max ~6 chars like Dazz Cam)
function shortName(preset: CameraPreset): string {
  const map: Record<string, string> = {
    'kodak-gold-200': 'K Gold',
    'disposable-flash': 'Disp.',
    'polaroid-600': 'Pol 600',
    'vhs-classic': 'VHS',
    'y2k-digital': 'Y2K',
    'fuji-superia-400': 'Fuji S',
    'kodak-portra-400': 'Portra',
    'kodak-ultramax-400': 'UltraM',
    'ilford-hp5': 'HP5',
    'cinestill-800t': 'CS800T',
    'agfa-vista-200': 'Agfa',
    'lomography-400': 'Lomo',
    'slide-velvia': 'Velvia',
    'redscale': 'Red',
    'cross-process': 'XPro',
    'hasselblad-portra': 'H500',
    'mamiya-rb67': 'RB67',
    'rolleiflex-bw': 'Rollei',
    'fuji-quicksnap': 'QSnap',
    'kodak-funsaver': 'FunSvr',
    'polaroid-sx70': 'SX-70',
    'instax-mini': 'Instax',
    'olympus-pen': 'OlyPen',
    'canon-demi': 'Demi',
    'sony-cybershot': 'Cyber',
    'canon-ixus': 'IXUS',
    'nokia-cam': 'Nokia',
    'super8-kodachrome': 'S8 K40',
    'super8-bw': 'S8 B&W',
    'regular8-faded': 'Reg 8',
    '16mm-cinema': '16mm',
    '16mm-nouvelle-vague': 'NV 16',
    'handycam-dcr': 'DCR',
    'vhs-glitch': 'Glitch',
    'vhs-lo-fi': 'Lo-Fi',
    'vhs-neon': 'Neon',
    'fisheye-lomo': 'Fish',
    'sepia-classic': 'Sepia',
    'tokyo-1998': 'TKY98',
    'osaka-dusk': 'Osaka',
    'kyoto-spring': 'Kyoto',
    'shibuya-crossing': 'Shib.',
    'noir-detective': 'Noir',
    'bleach-bypass': 'Bleach',
    'infrared': 'IR',
    'teal-orange': 'T&O',
  };
  return map[preset.id] ?? preset.name.slice(0, 6);
}

export function CameraCarousel({ presets, selectedId, onSelect, isPro }: CameraCarouselProps) {
  const flatRef = useRef<FlatList<CameraPreset>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleSelect = useCallback((preset: CameraPreset, index: number) => {
    onSelect(preset);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flatRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [onSelect]);

  const renderItem = useCallback(({ item: preset, index }: { item: CameraPreset; index: number }) => {
    const isSelected = preset.id === selectedId;
    const isHot = HOT_IDS.has(preset.id);
    const isLocked = preset.isPro && !isPro;
    const label = shortName(preset);

    const inputRange = [(index - 1.5) * FULL_ITEM, index * FULL_ITEM, (index + 1.5) * FULL_ITEM];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <TouchableOpacity
        onPress={() => handleSelect(preset, index)}
        activeOpacity={0.8}
        style={styles.itemTouch}
      >
        <Animated.View style={[styles.item, { transform: [{ scale }], opacity }]}>
          {/* HOT badge */}
          {isHot && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotText}>HOT</Text>
            </View>
          )}

          {/* Camera icon card */}
          <View style={[
            styles.iconCard,
            isSelected && styles.iconCardSelected,
            isLocked && styles.iconCardLocked,
          ]}>
            {getCameraIcon(preset, 46)}
            {isLocked && <View style={styles.lockVeil}><Text style={styles.lockEmoji}>🔒</Text></View>}
          </View>

          {/* Short name — selected gets pill */}
          <View style={[styles.namePill, isSelected && styles.namePillSelected]}>
            <Text style={[styles.nameText, isSelected && styles.nameTextSelected]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [selectedId, isPro, scrollX, handleSelect]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatRef}
        data={presets}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        decelerationRate="fast"
        snapToInterval={FULL_ITEM}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(_, index) => ({ length: FULL_ITEM, offset: FULL_ITEM * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: ITEM_HEIGHT + 8 },
  content: { paddingHorizontal: CENTER_OFFSET, alignItems: 'flex-start', paddingVertical: 4 },

  itemTouch: { marginHorizontal: SPACING / 2 },
  item: { width: ITEM_WIDTH, alignItems: 'center' },

  iconCard: {
    width: ITEM_WIDTH,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconCardSelected: {
    backgroundColor: '#2C2C2E',
    borderColor: '#FFB800',
    borderWidth: 2,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCardLocked: { opacity: 0.55 },

  lockVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  lockEmoji: { fontSize: 18 },

  hotBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  hotText: { color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  namePill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  namePillSelected: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  nameText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  nameTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
});
