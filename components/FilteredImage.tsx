/**
 * FilteredImage — Single Skia Canvas, all effects rendered inside.
 * capture() always snapshots the single canvas → correct filtered output.
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
  Rect,
  Circle,
  RadialGradient,
  LinearGradient as SkiaLinearGradient,
  Turbulence,
  vec,
  useCanvasRef,
  ImageFormat,
  ClipOp,
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

  const shift = settings.rgbShift * width * 0.015;

  // Core image with color grading
  const imageLayer = (x: number, y: number, w: number, h: number) => (
    <Group>
      <SkiaImage image={image} x={x} y={y} width={w} height={h} fit="cover">
        <ColorMatrix matrix={colorMatrix} />
        {settings.blur > 0 && <Blur blur={settings.blur * 8} />}
      </SkiaImage>
      {settings.rgbShift > 0 && (
        <>
          <SkiaImage image={image} x={x + shift} y={y} width={w} height={h} fit="cover" opacity={0.35}>
            <ColorMatrix matrix={[1,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,1,0]} />
          </SkiaImage>
          <SkiaImage image={image} x={x - shift} y={y} width={w} height={h} fit="cover" opacity={0.35}>
            <ColorMatrix matrix={[0,0,0,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,1,0]} />
          </SkiaImage>
        </>
      )}
    </Group>
  );

  // Overlay effects (tint, vignette, grain, etc.)
  const effectLayer = (x: number, y: number, w: number, h: number) => (
    <Group>
      {settings.tintOpacity > 0 && (
        <Rect x={x} y={y} width={w} height={h} color={settings.tint} opacity={settings.tintOpacity} />
      )}
      {settings.vignette > 0 && (
        <Rect x={x} y={y} width={w} height={h}>
          <RadialGradient
            c={vec(x + w / 2, y + h / 2)}
            r={Math.max(w, h) * 0.72}
            colors={['transparent', `rgba(0,0,0,${settings.vignette * 0.9})`]}
          />
        </Rect>
      )}
      {settings.lightLeak > 0 && (
        <Rect x={x} y={y} width={w * 0.7} height={h * 0.55}>
          <SkiaLinearGradient
            start={vec(x, y)}
            end={vec(x + w * 0.7, y + h * 0.55)}
            colors={[`rgba(255,180,50,${settings.lightLeak * 0.5})`, 'transparent']}
          />
        </Rect>
      )}
      {settings.halation > 0 && (
        <Rect x={x + w * 0.1} y={y} width={w * 0.8} height={h * 0.6}>
          <SkiaLinearGradient
            start={vec(x + w * 0.5, y)}
            end={vec(x + w * 0.5, y + h * 0.6)}
            colors={[`rgba(255,60,0,${settings.halation * 0.45})`, 'transparent']}
          />
        </Rect>
      )}
      {settings.flash > 0 && (
        <Rect x={x + w * 0.1} y={y + h * 0.05} width={w * 0.8} height={h * 0.7}>
          <RadialGradient
            c={vec(x + w / 2, y + h * 0.35)}
            r={Math.max(w, h) * 0.5}
            colors={[`rgba(255,255,240,${settings.flash * 0.65})`, 'transparent']}
          />
        </Rect>
      )}
      {settings.grain > 0 && (
        <Rect x={x} y={y} width={w} height={h} opacity={settings.grain * 0.55}>
          <Turbulence freqX={0.65} freqY={0.65} octaves={3} />
        </Rect>
      )}
      {dustParticles.map((p, i) => (
        <Circle key={`d${i}`} cx={x + p.x} cy={y + p.y} r={p.size / 2}
          color={`rgba(200,190,170,${p.opacity})`} />
      ))}
      {scratches.map((sc, i) => (
        <Rect key={`sc${i}`} x={x + sc.x} y={y + sc.top} width={1} height={sc.h}
          color={`rgba(255,255,255,${sc.opacity})`} />
      ))}
    </Group>
  );

  // Sprocket holes for film frames
  const sprocketHoles = (side: 'left' | 'right', sw: number) => {
    const sx = side === 'left' ? 0 : width - sw;
    return Array.from({ length: 10 }).map((_, i) => (
      <Rect key={`sp${side}${i}`}
        x={sx + 3} y={i * (height / 10) + 3}
        width={sw - 6} height={height / 10 - 6}
        r={2} color="#222" />
    ));
  };

  // Watermark text rendered outside canvas (React Native Text)
  const watermarkEl = showWatermark ? <Text style={styles.watermark}>RetroCam AI</Text> : null;
  const timestampEl = settings.timestamp ? <Text style={styles.timestamp}>{timestampStr}</Text> : null;

  // ── POLAROID ──
  if (frameType === 'polaroid') {
    const pb = Math.round(width * 0.05);
    const pbot = Math.round(width * 0.18);
    const imgW = width - pb * 2;
    const imgH = height - pb - pbot;
    return (
      <View style={{ width, height, backgroundColor: '#FFF' }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          <Rect x={0} y={0} width={width} height={height} color="#FFF" />
          <Group clip={{ x: pb, y: pb, width: imgW, height: imgH }}>
            {imageLayer(pb, pb, imgW, imgH)}
            {effectLayer(pb, pb, imgW, imgH)}
          </Group>
          {showWatermark && (
            <RoundedRect x={pb} y={pb + imgH + 4} width={imgW} height={pbot - 8} r={0} color="transparent" />
          )}
        </Canvas>
        {settings.timestamp && <Text style={[styles.timestamp, { bottom: pbot + 4, right: pb + 8 }]}>{timestampStr}</Text>}
        {showWatermark && (
          <View style={{ position: 'absolute', left: 0, top: pb + imgH, width, height: pbot, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6 }}>
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
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          <Rect x={0} y={0} width={width} height={height} color="#000" />
          {/* Left panel */}
          <Group clip={{ x: 4, y: 0, width: halfW, height }}>
            {imageLayer(4, 0, halfW, height)}
            {effectLayer(4, 0, halfW, height)}
          </Group>
          {/* Right panel */}
          <Group clip={{ x: halfW + 8, y: 0, width: halfW, height }}>
            {imageLayer(halfW + 8, 0, halfW, height)}
            {effectLayer(halfW + 8, 0, halfW, height)}
          </Group>
          {/* Divider */}
          <Rect x={halfW + 4} y={0} width={4} height={height} color="#111" />
          {/* Sprocket holes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Rect key={`hl${i}`} x={2} y={i * (height / 8) + 4} width={8} height={height / 8 - 8} r={2} color="#1A1A1A" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <Rect key={`hr${i}`} x={width - 10} y={i * (height / 8) + 4} width={8} height={height / 8 - 8} r={2} color="#1A1A1A" />
          ))}
        </Canvas>
        {timestampEl}
        {watermarkEl}
      </View>
    );
  }

  // ── 8mm / 16mm ──
  if (frameType === '8mm' || frameType === '16mm') {
    const sw = frameType === '16mm' ? 28 : 22;
    const innerW = width - sw * 2;
    return (
      <View style={{ width, height, backgroundColor: '#0A0A0A' }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          <Rect x={0} y={0} width={width} height={height} color="#0A0A0A" />
          <Group clip={{ x: sw, y: 0, width: innerW, height }}>
            {imageLayer(sw, 0, innerW, height)}
            {effectLayer(sw, 0, innerW, height)}
          </Group>
          {/* Left sprocket strip */}
          <Rect x={0} y={0} width={sw} height={height} color="#111" />
          {sprocketHoles('left', sw)}
          {/* Right sprocket strip */}
          <Rect x={width - sw} y={0} width={sw} height={height} color="#111" />
          {sprocketHoles('right', sw)}
        </Canvas>
        {timestampEl}
        {watermarkEl}
      </View>
    );
  }

  // ── FISHEYE ──
  if (frameType === 'fisheye') {
    const fishR = Math.min(width, height) * 0.46;
    const cx = width / 2;
    const cy = height / 2;
    return (
      <View style={{ width, height, backgroundColor: '#000' }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          <Rect x={0} y={0} width={width} height={height} color="#000" />
          <Group clip={<Circle cx={cx} cy={cy} r={fishR} />}>
            {imageLayer(cx - fishR, cy - fishR, fishR * 2, fishR * 2)}
            {effectLayer(cx - fishR, cy - fishR, fishR * 2, fishR * 2)}
          </Group>
        </Canvas>
        {timestampEl}
        {watermarkEl}
      </View>
    );
  }

  // ── CAMCORDER ──
  if (frameType === 'camcorder') {
    return (
      <View style={{ width, height }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          {imageLayer(0, 0, width, height)}
          {effectLayer(0, 0, width, height)}
          {/* Scanlines */}
          {Array.from({ length: Math.floor(height / 5) }).map((_, i) => (
            <Rect key={i} x={0} y={i * 5} width={width} height={1} color="rgba(0,0,0,0.05)" />
          ))}
        </Canvas>
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
        {watermarkEl}
      </View>
    );
  }

  // ── VHS ──
  if (frameType === 'vhs') {
    return (
      <View style={{ width, height }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          {imageLayer(0, 0, width, height)}
          {effectLayer(0, 0, width, height)}
          {Array.from({ length: Math.floor(height / 4) }).map((_, i) => (
            <Rect key={i} x={0} y={i * 4} width={width} height={1} color="rgba(0,0,0,0.07)" />
          ))}
          <Rect x={0} y={height * 0.72} width={width} height={3} color="rgba(255,255,255,0.04)" />
        </Canvas>
        {timestampEl}
        {watermarkEl}
      </View>
    );
  }

  // ── DIGITAL ──
  if (frameType === 'digital') {
    return (
      <View style={{ width, height }}>
        <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
          {imageLayer(0, 0, width, height)}
          {effectLayer(0, 0, width, height)}
        </Canvas>
        <View style={styles.digitalTopBar}>
          {settings.timestamp && <Text style={styles.digitalText}>{timestampStr}</Text>}
          <Text style={styles.digitalText}>AUTO</Text>
        </View>
        <View style={styles.digitalBottomBar} />
        {watermarkEl}
      </View>
    );
  }

  // ── DISPOSABLE / DEFAULT ──
  return (
    <View style={{ width, height, borderRadius: frameType === 'disposable' ? 8 : 0, overflow: 'hidden' }}>
      <Canvas ref={canvasRef} style={{ position: 'absolute', width, height }}>
        {imageLayer(0, 0, width, height)}
        {effectLayer(0, 0, width, height)}
      </Canvas>
      {timestampEl}
      {watermarkEl}
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
