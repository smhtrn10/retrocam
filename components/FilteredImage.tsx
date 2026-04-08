/**
 * FilteredImage — Full Skia-powered filter engine
 * - ColorMatrix: contrast, saturation, temperature, fade
 * - Blur: soft focus
 * - RadialGradient: real vignette
 * - LinearGradient: real light leak, halation, flash
 * - Turbulence: real film grain noise
 * - RuntimeShader: RGB chromatic aberration shift
 * - Dust & scratches: seeded particles
 */
import { useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
  Blur,
  Group,
  RoundedRect,
  Circle,
  RadialGradient,
  LinearGradient as SkiaLinearGradient,
  Turbulence,
  vec,
  useCanvasRef,
  ImageFormat,
} from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraPreset } from '@/constants/presets';
import { buildColorMatrix } from '@/utils/filterEngine';

export interface FilteredImageRef {
  capture: () => Promise<string | null>;
}

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

export const FilteredImage = forwardRef<FilteredImageRef, FilteredImageProps>(function FilteredImage(
  { uri, preset, width, height, showWatermark = false, overrides = {} },
  ref
) {
  const image = useImage(uri);
  const canvasRef = useCanvasRef();
  const settings = { ...preset.settings, ...overrides };
  const { frameType } = preset;

  useImperativeHandle(ref, () => ({
    capture: async () => {
      try {
        const snapshot = await canvasRef.current?.makeImageSnapshotAsync();
        if (!snapshot) return null;
        // encodeToBase64 avoids stack overflow from large byte arrays
        const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 92);
        const filename = `retrocam_filtered_${Date.now()}.jpg`;
        const fileUri = (FileSystem.documentDirectory ?? '') + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return fileUri;
      } catch (e) {
        console.error('Capture error:', e);
        return null;
      }
    },
  }));

  const colorMatrix = useMemo(() => buildColorMatrix(settings), [
    settings.contrast, settings.saturation, settings.temperature, settings.fade,
  ]);

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

  if (!image) {
    return <View style={{ width, height, backgroundColor: '#000' }} />;
  }

  // Build the core image layer with color grading + rgb shift
  const renderImageLayer = (w: number, h: number) => {
    const shift = settings.rgbShift * w * 0.015;
    return (
      <Group>
        <SkiaImage image={image} x={0} y={0} width={w} height={h} fit="cover">
          <ColorMatrix matrix={colorMatrix} />
          {settings.blur > 0 && <Blur blur={settings.blur * 8} />}
        </SkiaImage>
        {/* RGB chromatic aberration: red channel shifted right, blue shifted left */}
        {settings.rgbShift > 0 && (
          <>
            <SkiaImage image={image} x={shift} y={0} width={w} height={h} fit="cover" opacity={0.35}>
              <ColorMatrix matrix={[
                1, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 1, 0,
              ]} />
            </SkiaImage>
            <SkiaImage image={image} x={-shift} y={0} width={w} height={h} fit="cover" opacity={0.35}>
              <ColorMatrix matrix={[
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 1, 0, 0,
                0, 0, 0, 1, 0,
              ]} />
            </SkiaImage>
          </>
        )}
      </Group>
    );
  };

  // All overlay effects as Skia primitives
  const renderEffects = (w: number, h: number) => (
    <Group>
      {/* Tint color wash */}
      {settings.tintOpacity > 0 && (
        <RoundedRect x={0} y={0} width={w} height={h} r={0}
          color={settings.tint} opacity={settings.tintOpacity} />
      )}

      {/* Real radial vignette */}
      {settings.vignette > 0 && (
        <RoundedRect x={0} y={0} width={w} height={h} r={0}>
          <RadialGradient
            c={vec(w / 2, h / 2)}
            r={Math.max(w, h) * 0.72}
            colors={['transparent', `rgba(0,0,0,${settings.vignette * 0.9})`]}
          />
        </RoundedRect>
      )}

      {/* Real linear light leak (top-left corner) */}
      {settings.lightLeak > 0 && (
        <RoundedRect x={0} y={0} width={w * 0.7} height={h * 0.55} r={0}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(w * 0.7, h * 0.55)}
            colors={[`rgba(255,180,50,${settings.lightLeak * 0.5})`, 'transparent']}
          />
        </RoundedRect>
      )}

      {/* Real halation glow (red highlight bleed) */}
      {settings.halation > 0 && (
        <RoundedRect x={w * 0.1} y={0} width={w * 0.8} height={h * 0.6} r={0}>
          <SkiaLinearGradient
            start={vec(w * 0.5, 0)}
            end={vec(w * 0.5, h * 0.6)}
            colors={[`rgba(255,60,0,${settings.halation * 0.45})`, 'transparent']}
          />
        </RoundedRect>
      )}

      {/* Flash burn (center overexposure) */}
      {settings.flash > 0 && (
        <RoundedRect x={w * 0.1} y={h * 0.05} width={w * 0.8} height={h * 0.7} r={0}>
          <RadialGradient
            c={vec(w / 2, h * 0.35)}
            r={Math.max(w, h) * 0.5}
            colors={[`rgba(255,255,240,${settings.flash * 0.65})`, 'transparent']}
          />
        </RoundedRect>
      )}

      {/* Real film grain using Turbulence noise */}
      {settings.grain > 0 && (
        <RoundedRect x={0} y={0} width={w} height={h} r={0} opacity={settings.grain * 0.55}>
          <Turbulence freqX={0.65} freqY={0.65} octaves={3} />
        </RoundedRect>
      )}

      {/* Dust particles */}
      {dustParticles.map((p, i) => (
        <Circle key={`d${i}`} cx={p.x} cy={p.y} r={p.size / 2}
          color={`rgba(200,190,170,${p.opacity})`} />
      ))}

      {/* Film scratches */}
      {scratches.map((sc, i) => (
        <RoundedRect key={`sc${i}`} x={sc.x} y={sc.top} width={1} height={sc.h} r={0}
          color={`rgba(255,255,255,${sc.opacity})`} />
      ))}
    </Group>
  );

  const renderCanvas = (w: number, h: number) => (
    <Canvas ref={canvasRef} style={{ position: 'absolute', width: w, height: h }}>
      {renderImageLayer(w, h)}
      {renderEffects(w, h)}
    </Canvas>
  );

  // ── POLAROID ──
  if (frameType === 'polaroid') {
    const polBorder = Math.round(width * 0.05);
    const polBottom = Math.round(width * 0.18);
    const imgW = width - polBorder * 2;
    const imgH = height - polBorder - polBottom;
    return (
      <View style={{ width, height, backgroundColor: '#FFF' }}>
        <View style={{ position: 'absolute', left: polBorder, top: polBorder, width: imgW, height: imgH, overflow: 'hidden' }}>
          {renderCanvas(imgW, imgH)}
          {settings.timestamp && <Text style={[styles.timestamp, { bottom: 8, right: 8 }]}>{timestampStr}</Text>}
        </View>
        {showWatermark && (
          <View style={{ position: 'absolute', left: 0, top: polBorder + imgH, width, height: polBottom, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6 }}>
            <Text style={styles.watermarkDark}>RetroCam AI</Text>
          </View>
        )}
      </View>
    );
  }

  // ── HALF-FRAME ──
  if (frameType === 'half-frame') {
    const halfW = Math.floor(width / 2) - 6;
    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        <View style={{ position: 'absolute', left: 4, top: 0, width: halfW, height, overflow: 'hidden' }}>
          {renderCanvas(halfW, height)}
        </View>
        <View style={{ position: 'absolute', left: halfW + 8, top: 0, width: halfW, height, overflow: 'hidden' }}>
          {renderCanvas(halfW, height)}
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
    const sprocketW = frameType === '16mm' ? 28 : 22;
    const innerW = width - sprocketW * 2;
    return (
      <View style={{ width, height, backgroundColor: '#0A0A0A' }}>
        <View style={{ position: 'absolute', left: sprocketW, top: 0, width: innerW, height, overflow: 'hidden' }}>
          {renderCanvas(innerW, height)}
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
    const fishR = Math.min(width, height) * 0.46;
    const fishD = fishR * 2;
    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        <View style={{ position: 'absolute', left: width / 2 - fishR, top: height / 2 - fishR, width: fishD, height: fishD, borderRadius: fishR, overflow: 'hidden' }}>
          {renderCanvas(fishD, fishD)}
        </View>
        {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── CAMCORDER ──
  if (frameType === 'camcorder') {
    return (
      <View style={{ width, height }}>
        {renderCanvas(width, height)}
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
      <View style={{ width, height }}>
        {renderCanvas(width, height)}
        {Array.from({ length: Math.floor(height / 4) }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', left: 0, top: i * 4, width, height: 1, backgroundColor: 'rgba(0,0,0,0.07)' }} />
        ))}
        <View style={{ position: 'absolute', left: 0, top: height * 0.72, width, height: 3, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
        {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
      </View>
    );
  }

  // ── DIGITAL ──
  if (frameType === 'digital') {
    return (
      <View style={{ width, height }}>
        {renderCanvas(width, height)}
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
    <View style={{ width, height, borderRadius: frameType === 'disposable' ? 8 : 0, overflow: 'hidden' }}>
      {renderCanvas(width, height)}
      {settings.timestamp && <Text style={styles.timestamp}>{timestampStr}</Text>}
      {showWatermark && <Text style={styles.watermark}>RetroCam AI</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
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
