/**
 * FilteredImage — React Native only (no Skia, no Reanimated)
 * Frame overlays: polaroid, half-frame, 8mm, 16mm, camcorder, fisheye, disposable, vhs, digital
 */
import { useMemo } from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CameraPreset } from '@/constants/presets';

interface FilteredImageProps {
  uri: string;
  preset: CameraPreset;
  width: number;
  height: number;
  showWatermark?: boolean;
  overrides?: Partial<CameraPreset['settings']>;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function FilteredImage({
  uri, preset, width, height, showWatermark = false, overrides = {},
}: FilteredImageProps) {
  const baseSettings = preset.settings;
  const settings = { ...baseSettings, ...overrides };
  const { frameType } = preset;

  const timestampStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  const dustParticles = useMemo(() => {
    if (settings.dust <= 0) return [];
    const rand = seededRandom(42);
    return Array.from({ length: Math.floor(settings.dust * 20) }, () => ({
      x: rand() * width, y: rand() * height,
      size: rand() * 3 + 1, opacity: rand() * 0.4 + 0.15,
    }));
  }, [settings.dust, width, height]);

  const scratches = useMemo(() => {
    if (settings.dust <= 0.2) return [];
    const rand = seededRandom(99);
    return Array.from({ length: Math.floor(settings.dust * 4) }, () => ({
      x: rand() * width,
      top: rand() * height * 0.4,
      h: rand() * height * 0.3 + height * 0.1,
      opacity: rand() * 0.2 + 0.06,
    }));
  }, [settings.dust, width, height]);

  const polBorder = Math.round(width * 0.05);
  const polBottom = Math.round(width * 0.18);
  const imgW = width - polBorder * 2;
  const imgH = height - polBorder - polBottom;
  const halfW = Math.floor(width / 2) - 6;
  const sprocketW = frameType === '16mm' ? 28 : 22;
  const fishR = Math.min(width, height) * 0.46;
  const bwOpacity = settings.saturation === 0 ? 0.9 : settings.saturation < 0.5 ? (1 - settings.saturation) * 0.55 : 0;

  const renderImage = (x = 0, y = 0, w = width, h = height) => (
    <Image source={{ uri }} style={{ position: 'absolute', left: x, top: y, width: w, height: h }} resizeMode="cover" />
  );

  const renderEffects = (w = width, h = height, ox = 0, oy = 0) => (
    <>
      {settings.tintOpacity > 0 && (
        <View style={{ position: 'absolute', left: ox, top: oy, width: w, height: h, backgroundColor: settings.tint, opacity: settings.tintOpacity }} />
      )}
      {settings.vignette > 0 && (
        <LinearGradient colors={['transparent', `rgba(0,0,0,${settings.vignette * 0.85})`]} style={{ position: 'absolute', left: ox, top: oy, width: w, height: h }} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
      )}
      {settings.lightLeak > 0 && (
        <LinearGradient colors={[`rgba(255,180,50,${settings.lightLeak * 0.45})`, 'transparent']} style={{ position: 'absolute', left: ox, top: oy, width: w * 0.6, height: h * 0.5 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      {settings.halation > 0 && (
        <LinearGradient colors={[`rgba(255,60,0,${settings.halation * 0.4})`, 'transparent']} style={{ position: 'absolute', left: ox + w * 0.2, top: oy, width: w * 0.6, height: h * 0.5 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      )}
      {settings.flash > 0 && (
        <LinearGradient colors={[`rgba(255,255,240,${settings.flash * 0.6})`, 'transparent']} style={{ position: 'absolute', left: ox + w * 0.15, top: oy + h * 0.1, width: w * 0.7, height: h * 0.6 }} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      )}
      {settings.grain > 0 && (
        <View style={{ position: 'absolute', left: ox, top: oy, width: w, height: h, backgroundColor: `rgba(140,130,120,${settings.grain * 0.18})` }} />
      )}
      {bwOpacity > 0 && (
        <View style={{ position: 'absolute', left: ox, top: oy, width: w, height: h, backgroundColor: `rgba(20,20,20,${bwOpacity})` }} />
      )}
      {settings.rgbShift > 0 && (
        <>
          <View style={{ position: 'absolute', left: ox, top: oy, width: w, height: h, backgroundColor: `rgba(255,0,0,${settings.rgbShift * 0.1})` }} />
          <View style={{ position: 'absolute', left: ox + settings.rgbShift * 5, top: oy, width: w, height: h, backgroundColor: `rgba(0,0,255,${settings.rgbShift * 0.08})` }} />
        </>
      )}
      {settings.temperature !== 0 && (
        <View style={{ 
          position: 'absolute', left: ox, top: oy, width: w, height: h, 
          backgroundColor: settings.temperature > 0 ? '#FFB800' : '#00BFFF', 
          opacity: Math.abs(settings.temperature) * 0.15 
        }} />
      )}
      {settings.blur > 0 && (
        <BlurView 
          intensity={settings.blur * 20} 
          style={{ position: 'absolute', left: ox, top: oy, width: w, height: h }} 
          tint="light"
        />
      )}
      {dustParticles.map((p, i) => (
        <View key={`d${i}`} style={{ position: 'absolute', left: ox + p.x, top: oy + p.y, width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: `rgba(200,190,170,${p.opacity})` }} />
      ))}
      {scratches.map((sc, i) => (
        <View key={`sc${i}`} style={{ position: 'absolute', left: ox + sc.x, top: oy + sc.top, width: 1, height: sc.h, backgroundColor: `rgba(255,255,255,${sc.opacity})` }} />
      ))}
    </>
  );

  // ── POLAROID ──
  if (frameType === 'polaroid') {
    return (
      <View style={[styles.root, { width, height, backgroundColor: '#FFF' }]}>
        <View style={{ position: 'absolute', left: polBorder, top: polBorder, width: imgW, height: imgH, overflow: 'hidden' }}>
          {renderImage(0, 0, imgW, imgH)}
          {renderEffects(imgW, imgH)}
          {settings.timestamp && <Text style={[styles.timestamp, { bottom: 8, right: 8 }]}>{timestampStr}</Text>}
        </View>
        <View style={{ position: 'absolute', left: 0, top: polBorder + imgH, width, height: polBottom, backgroundColor: '#FFF', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6 }}>
          {showWatermark && <Text style={styles.watermarkDark}>RetroCam AI</Text>}
        </View>
      </View>
    );
  }

  // ── HALF-FRAME ──
  if (frameType === 'half-frame') {
    return (
      <View style={[styles.root, { width, height, backgroundColor: '#000' }]}>
        <View style={{ position: 'absolute', left: 4, top: 0, width: halfW, height, overflow: 'hidden' }}>
          {renderImage(0, 0, halfW, height)}{renderEffects(halfW, height)}
        </View>
        <View style={{ position: 'absolute', left: halfW + 8, top: 0, width: halfW, height, overflow: 'hidden' }}>
          {renderImage(0, 0, halfW, height)}{renderEffects(halfW, height)}
        </View>
        <View style={{ position: 'absolute', left: halfW + 4, top: 0, width: 4, height, backgroundColor: '#111' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`hl${i}`} style={{ position: 'absolute', left: 2, top: i * (height / 8) + 4, width: 8, height: height / 8 - 8, borderRadius: 2, backgroundColor: '#1A1A1A' }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`hr${i}`} style={{ position: 'absolute', right: 2, top: i * (height / 8) + 4, width: 8, height: height / 8 - 8, borderRadius: 2, backgroundColor: '#1A1A1A' }} />
        ))}
        {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── 8mm / 16mm ──
  if (frameType === '8mm' || frameType === '16mm') {
    const innerW = width - sprocketW * 2;
    return (
      <View style={[styles.root, { width, height, backgroundColor: '#0A0A0A' }]}>
        <View style={{ position: 'absolute', left: sprocketW, top: 0, width: innerW, height, overflow: 'hidden' }}>
          {renderImage(0, 0, innerW, height)}{renderEffects(innerW, height)}
          {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        </View>
        {[0, 1].map((side) => (
          <View key={side} style={{ position: 'absolute', [side === 0 ? 'left' : 'right']: 0, top: 0, width: sprocketW, height, backgroundColor: '#111' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={{ position: 'absolute', left: 3, top: i * (height / 10) + 3, width: sprocketW - 6, height: height / 10 - 6, borderRadius: 2, backgroundColor: '#222' }} />
            ))}
          </View>
        ))}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── FISHEYE ──
  if (frameType === 'fisheye') {
    return (
      <View style={[styles.root, { width, height, backgroundColor: '#000' }]}>
        <View style={{ position: 'absolute', left: width / 2 - fishR, top: height / 2 - fishR, width: fishR * 2, height: fishR * 2, borderRadius: fishR, overflow: 'hidden' }}>
          {renderImage(0, 0, fishR * 2, fishR * 2)}{renderEffects(fishR * 2, fishR * 2)}
        </View>
        {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── CAMCORDER ──
  if (frameType === 'camcorder') {
    return (
      <View style={[styles.root, { width, height }]}>
        {renderImage()}{renderEffects()}
        {Array.from({ length: Math.floor(height / 5) }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: 0, top: i * 5, width, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
        ))}
        <View style={styles.camcorderTopBar}>
          <View style={styles.recDot} /><Text style={styles.recText}>REC</Text>
          <Text style={styles.camcorderMid}>SP  Hi8</Text>
          <View style={styles.batteryOuter}><View style={styles.batteryInner} /><View style={styles.batteryNub} /></View>
        </View>
        <View style={styles.camcorderBottomBar}>
          {settings.timestamp && (
            <Text style={styles.camcorderTime}>{timestampStr}  {String(new Date().getHours()).padStart(2,'0')}:{String(new Date().getMinutes()).padStart(2,'0')}:{String(new Date().getSeconds()).padStart(2,'0')}</Text>
          )}
          <View style={styles.zoomTrack}><View style={styles.zoomFill} /></View>
        </View>
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── VHS ──
  if (frameType === 'vhs') {
    return (
      <View style={[styles.root, { width, height }]}>
        {renderImage()}{renderEffects()}
        {Array.from({ length: Math.floor(height / 4) }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: 0, top: i * 4, width, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
        ))}
        <View style={{ position: 'absolute', left: 0, top: height * 0.72, width, height: 3, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <View style={{ position: 'absolute', left: 0, top: height * 0.73, width: width * 0.55, height: 2, backgroundColor: 'rgba(0,0,0,0.1)' }} />
        {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── DIGITAL ──
  if (frameType === 'digital') {
    return (
      <View style={[styles.root, { width, height }]}>
        {renderImage()}{renderEffects()}
        <View style={styles.digitalTopBar}>
          {settings.timestamp && <Text style={styles.digitalText}>{timestampStr}</Text>}
          <Text style={styles.digitalText}>AUTO</Text>
        </View>
        <View style={styles.digitalBottomBar} />
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── DISPOSABLE / DEFAULT ──
  return (
    <View style={[styles.root, { width, height, borderRadius: frameType === 'disposable' ? 8 : 0 }]}>
      {renderImage()}{renderEffects()}
      {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
      {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: '#000' },
  timestamp: {
    position: 'absolute', bottom: 20, right: 14,
    color: 'rgba(255,180,50,0.92)', fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  watermark: {
    position: 'absolute', bottom: 44, right: 14,
    color: 'rgba(255,255,255,0.45)', fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  watermarkDark: { color: 'rgba(0,0,0,0.3)', fontSize: 11 },
  camcorderTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  recText: { color: 'rgba(255,60,60,0.9)', fontSize: 11, fontWeight: '700' },
  camcorderMid: { flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  batteryOuter: { flexDirection: 'row', alignItems: 'center' },
  batteryInner: { width: 18, height: 10, backgroundColor: 'rgba(100,255,100,0.8)', borderRadius: 1 },
  batteryNub: { width: 3, height: 6, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1, marginLeft: 1 },
  camcorderBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8,
  },
  camcorderTime: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  zoomTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  zoomFill: { width: '45%', height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 },
  digitalTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8,
  },
  digitalBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  digitalText: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
