/**
 * FilteredImage — Skia Canvas with burned-in overlays, shaders, and high-resolution export.
 * All overlays (vintage date stamp, HUDs, frames, watermarks) are drawn inside Skia
 * so they are permanently burned into exported photos.
 */
import { useMemo, forwardRef, useImperativeHandle } from 'react';
import { View, Platform } from 'react-native';
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
  Text as SkiaText,
  matchFont,
  Skia,
  drawAsPicture,
} from '@shopify/react-native-skia';
import type { SkSurface, SkImage, SkFont } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraPreset } from '@/constants/presets';
import { buildColorMatrix } from '@/utils/filterEngine';
import { LensType } from '@/constants/lenses';

export type AspectRatioType = 'full' | '1:1' | '3:2' | '4:5';

export interface FilteredImageRef {
  capture: () => Promise<string | null>;
}

export interface FilteredImageProps {
  uri: string;
  secondaryUri?: string;
  preset: CameraPreset;
  width: number;
  height: number;
  showWatermark?: boolean;
  overrides?: Partial<CameraPreset['settings']>;
  aspectRatio?: AspectRatioType;
  lens?: LensType;
  filterOpacity?: number;
}

export interface LuminancePeak {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  luminance: number; // 0..1
}

/**
 * Dynamically detects luminance peaks in an image by downsampling to a 32x32 surface,
 * calculating Rec. 709 luminance ($0.2126R + 0.7152G + 0.0722B$), finding highlight
 * centroid for halation, and local maxima for specular star flares.
 */
export function detectLuminancePeaks(
  image: SkImage | null,
  gridSize = 32,
  threshold = 0.68
): { halationCenter: LuminancePeak; specularPeaks: LuminancePeak[] } {
  const defaultCenter: LuminancePeak = { x: 0.5, y: 0.28, luminance: 0.5 };
  const defaultPeaks: LuminancePeak[] = [
    { x: 0.5, y: 0.30, luminance: 0.8 },
    { x: 0.7, y: 0.22, luminance: 0.7 },
  ];

  if (!image) {
    return { halationCenter: defaultCenter, specularPeaks: defaultPeaks };
  }

  try {
    const surf = Skia.Surface.Make(gridSize, gridSize);
    if (!surf) return { halationCenter: defaultCenter, specularPeaks: defaultPeaks };

    const canvas = surf.getCanvas();
    const paint = Skia.Paint();
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, gridSize, gridSize),
      paint
    );
    surf.flush();
    const snap = surf.makeImageSnapshot();
    const pixels = snap.readPixels();
    if (!pixels || pixels.length < gridSize * gridSize * 4) {
      return { halationCenter: defaultCenter, specularPeaks: defaultPeaks };
    }

    let sumX = 0;
    let sumY = 0;
    let sumWeight = 0;
    let maxLum = 0;
    let bestX = 0.5;
    let bestY = 0.28;

    const candidates: LuminancePeak[] = [];

    for (let py = 0; py < gridSize; py++) {
      for (let px = 0; px < gridSize; px++) {
        const idx = (py * gridSize + px) * 4;
        const rawR = pixels[idx] as number;
        const rawG = pixels[idx + 1] as number;
        const rawB = pixels[idx + 2] as number;
        const r = rawR > 1.0 ? rawR / 255.0 : rawR;
        const g = rawG > 1.0 ? rawG / 255.0 : rawG;
        const b = rawB > 1.0 ? rawB / 255.0 : rawB;

        // ITU-R BT.709 relative luminance
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        if (lum > maxLum) {
          maxLum = lum;
          bestX = (px + 0.5) / gridSize;
          bestY = (py + 0.5) / gridSize;
        }

        if (lum >= threshold) {
          const weight = lum - threshold;
          sumX += ((px + 0.5) / gridSize) * weight;
          sumY += ((py + 0.5) / gridSize) * weight;
          sumWeight += weight;
          candidates.push({ x: (px + 0.5) / gridSize, y: (py + 0.5) / gridSize, luminance: lum });
        }
      }
    }

    const halationCenter: LuminancePeak = sumWeight > 0.01
      ? { x: sumX / sumWeight, y: sumY / sumWeight, luminance: maxLum }
      : { x: bestX, y: bestY, luminance: maxLum };

    // Sort specular candidates by luminance descending
    candidates.sort((a, b) => b.luminance - a.luminance);
    const specularPeaks: LuminancePeak[] = [];
    for (const c of candidates) {
      // Ensure specular stars don't overlap too closely
      const isTooClose = specularPeaks.some(p => Math.hypot(p.x - c.x, p.y - c.y) < 0.18);
      if (!isTooClose) {
        specularPeaks.push(c);
        if (specularPeaks.length >= 2) break;
      }
    }

    while (specularPeaks.length < 2) {
      specularPeaks.push(defaultPeaks[specularPeaks.length]);
    }

    return { halationCenter, specularPeaks };
  } catch {
    return { halationCenter: defaultCenter, specularPeaks: defaultPeaks };
  }
}

/**
 * Injects JPEG APP1 EXIF segment from original photo into Skia-exported JPEG base64 string.
 */
export async function injectExifFromOriginal(
  exportedBase64: string,
  originalUri: string
): Promise<string> {
  try {
    if (!originalUri) return exportedBase64;

    // Read the beginning of original photo where EXIF headers reside (up to 64KB)
    let rawHead: string;
    try {
      rawHead = await FileSystem.readAsStringAsync(originalUri, {
        encoding: FileSystem.EncodingType.Base64,
        length: 65536,
      });
    } catch {
      rawHead = await FileSystem.readAsStringAsync(originalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (!rawHead) return exportedBase64;

    const origBinary = atob(rawHead);
    const origLen = origBinary.length;
    const origBytes = new Uint8Array(origLen);
    for (let i = 0; i < origLen; i++) {
      origBytes[i] = origBinary.charCodeAt(i);
    }

    // Verify JPEG SOI (0xFF, 0xD8)
    if (origBytes.length < 4 || origBytes[0] !== 0xFF || origBytes[1] !== 0xD8) {
      return exportedBase64;
    }

    // Locate APP1 marker (0xFF, 0xE1) in original image
    let app1Segment: Uint8Array | null = null;
    let offset = 2;
    while (offset < origBytes.length - 4) {
      if (origBytes[offset] !== 0xFF) break;
      const marker = origBytes[offset + 1];
      if (marker === 0xD8 || marker === 0xD9 || marker === 0xDA) break;

      const segLen = (origBytes[offset + 2] << 8) | origBytes[offset + 3];
      if (segLen < 2) break;

      if (marker === 0xE1) {
        app1Segment = origBytes.slice(offset, offset + 2 + segLen);
        break;
      }
      offset += 2 + segLen;
    }

    if (!app1Segment || app1Segment.length === 0) {
      return exportedBase64;
    }

    const expBinary = atob(exportedBase64);
    const expLen = expBinary.length;
    const expBytes = new Uint8Array(expLen);
    for (let i = 0; i < expLen; i++) {
      expBytes[i] = expBinary.charCodeAt(i);
    }

    // Verify exported JPEG SOI
    if (expBytes.length < 2 || expBytes[0] !== 0xFF || expBytes[1] !== 0xD8) {
      return exportedBase64;
    }

    // Construct merged JPEG: SOI (2 bytes) + APP1 Segment + Rest of Exported JPEG
    const merged = new Uint8Array(expBytes.length + app1Segment.length);
    merged.set(expBytes.subarray(0, 2), 0);
    merged.set(app1Segment, 2);
    merged.set(expBytes.subarray(2), 2 + app1Segment.length);

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < merged.length; i += chunkSize) {
      const sub = merged.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(sub));
    }
    return btoa(binary);
  } catch (err) {
    console.warn('[RetroCam] EXIF injection bypassed:', err);
    return exportedBase64;
  }
}

/**
 * Calculates export dimensions maintaining selected aspect ratio and clamping to maxDimension.
 */
export function getAspectDimensions(
  nativeW: number,
  nativeH: number,
  aspectRatio: AspectRatioType = 'full',
  maxDimension: number = 4096
): { width: number; height: number } {
  if (!nativeW || !nativeH || nativeW <= 0 || nativeH <= 0) {
    return { width: 1080, height: 1080 };
  }

  const isLandscape = nativeW > nativeH;
  let targetRatio: number;

  switch (aspectRatio) {
    case '1:1':
      targetRatio = 1.0;
      break;
    case '3:2':
      targetRatio = isLandscape ? 3 / 2 : 2 / 3;
      break;
    case '4:5':
      targetRatio = isLandscape ? 5 / 4 : 4 / 5;
      break;
    case 'full':
    default:
      targetRatio = nativeW / nativeH;
      break;
  }

  const sourceRatio = nativeW / nativeH;
  let cropW: number;
  let cropH: number;

  if (Math.abs(sourceRatio - targetRatio) < 0.001) {
    cropW = nativeW;
    cropH = nativeH;
  } else if (sourceRatio > targetRatio) {
    // Source is wider than target ratio: crop horizontal edges
    cropH = nativeH;
    cropW = Math.round(nativeH * targetRatio);
  } else {
    // Source is taller than target ratio: crop vertical edges
    cropW = nativeW;
    cropH = Math.round(nativeW / targetRatio);
  }

  // Clamp to maxDimension proportionally
  if (cropW > maxDimension || cropH > maxDimension) {
    const scale = Math.min(maxDimension / cropW, maxDimension / cropH);
    return {
      width: Math.round(cropW * scale),
      height: Math.round(cropH * scale),
    };
  }

  return { width: cropW, height: cropH };
}

/**
 * Resolves a safe system font without throwing native errors.
 */
export function getSafeFont(
  fontSize: number,
  options?: { isMono?: boolean; fontWeight?: 'normal' | 'bold' | '500' | '700' }
): SkFont | null {
  const isMono = options?.isMono ?? true;
  const weight = options?.fontWeight ?? 'bold';
  const preferredFamily = isMono
    ? (Platform.OS === 'ios' ? 'Courier' : 'monospace')
    : (Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif');

  // Tier 1: Preferred platform family
  try {
    const font = matchFont({
      fontFamily: preferredFamily,
      fontSize,
      fontWeight: weight,
    });
    if (font) return font;
  } catch {}

  // Tier 2: Generic fallback
  try {
    const font = matchFont({
      fontSize,
      fontWeight: weight,
    });
    if (font) return font;
  } catch {}

  // Tier 3: Direct Skia default Font constructor
  try {
    const font = Skia.Font(undefined, fontSize);
    if (font) return font;
  } catch {}

  return null;
}

/**
 * Measures text advance safely with fallback.
 */
export function getTextWidth(font: SkFont | null, text: string): number {
  if (!font || !text) return 0;
  try {
    if (typeof font.getTextWidth === 'function') {
      return font.getTextWidth(text);
    }
    if (typeof font.measureText === 'function') {
      return font.measureText(text).width;
    }
  } catch {}
  return text.length * font.getSize() * 0.6;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getSeedFromUri(uri: string): number {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = uri.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// ─────────────────────────────────────────────────────────────
//  Layer Helpers
// ─────────────────────────────────────────────────────────────

function renderImageLayer(
  image: SkImage,
  secondaryImage: SkImage | null,
  settings: CameraPreset['settings'],
  colorMatrix: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
  lens: LensType = 'prime',
  specularPeaks?: LuminancePeak[]
) {
  const isWide = lens === 'wide';
  const shift = Math.min(settings.rgbShift * w * 0.006 * (isWide ? 1.6 : 1.0), 3.5 * scale);
  const p1 = specularPeaks?.[0] ?? { x: 0.5, y: 0.3, luminance: 0.8 };
  const p2 = specularPeaks?.[1] ?? { x: 0.7, y: 0.22, luminance: 0.7 };
  return (
    <Group>
      <SkiaImage image={image} x={x} y={y} width={w} height={h} fit="cover">
        <ColorMatrix matrix={colorMatrix} />
        {settings.blur > 0 && <Blur blur={settings.blur * 8 * scale} />}
      </SkiaImage>

      {secondaryImage && (
        <Group blendMode="screen" opacity={0.5}>
          <SkiaImage image={secondaryImage} x={x} y={y} width={w} height={h} fit="cover">
            <ColorMatrix matrix={colorMatrix} />
            {settings.blur > 0 && <Blur blur={settings.blur * 8 * scale} />}
          </SkiaImage>
        </Group>
      )}

      {/* Optical Prism Refraction (Lens or Preset Setting) */}
      {(lens === 'prism' || (settings.prism !== undefined && settings.prism > 0)) && (
        <>
          <Group blendMode="screen" opacity={lens === 'prism' ? 0.38 : (settings.prism || 0) * 0.3}>
            <SkiaImage image={image} x={x - w * 0.065} y={y - h * 0.025} width={w} height={h} fit="cover">
              <ColorMatrix matrix={colorMatrix} />
            </SkiaImage>
          </Group>
          <Group blendMode="screen" opacity={lens === 'prism' ? 0.38 : (settings.prism || 0) * 0.3}>
            <SkiaImage image={image} x={x + w * 0.065} y={y + h * 0.025} width={w} height={h} fit="cover">
              <ColorMatrix matrix={colorMatrix} />
            </SkiaImage>
          </Group>
        </>
      )}

      {/* Optical Star Cross Flare on Specular Highlights */}
      {lens === 'star' && (
        <Group blendMode="screen" opacity={0.65}>
          {/* Primary highlight star attached to dynamic specular peak */}
          <Circle cx={x + w * p1.x} cy={y + h * p1.y} r={12 * scale} color="rgba(255,250,225,0.85)" />
          <Rect x={x + w * p1.x - 24 * scale} y={y + h * p1.y - 0.75 * scale} width={48 * scale} height={1.5 * scale} color="rgba(255,250,225,0.75)" />
          <Rect x={x + w * p1.x - 0.75 * scale} y={y + h * p1.y - 24 * scale} width={1.5 * scale} height={48 * scale} color="rgba(255,250,225,0.75)" />
          {/* Secondary micro highlight star attached to dynamic specular peak */}
          <Circle cx={x + w * p2.x} cy={y + h * p2.y} r={8 * scale} color="rgba(255,245,210,0.75)" />
          <Rect x={x + w * p2.x - 16 * scale} y={y + h * p2.y - 0.6 * scale} width={32 * scale} height={1.2 * scale} color="rgba(255,245,210,0.65)" />
          <Rect x={x + w * p2.x - 0.6 * scale} y={y + h * p2.y - 16 * scale} width={1.2 * scale} height={32 * scale} color="rgba(255,245,210,0.65)" />
        </Group>
      )}

      {/* Optical Fisheye Barrel Distortion Vignette */}
      {lens === 'fisheye' && (
        <Group>
          <Rect x={x} y={y} width={w} height={h}>
            <RadialGradient
              c={vec(x + w / 2, y + h / 2)}
              r={Math.min(w, h) * 0.54}
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)', '#000000']}
              positions={[0, 0.72, 0.92, 1.0]}
            />
          </Rect>
        </Group>
      )}

      {shift > 0 && (
        <Group blendMode="screen" opacity={0.22}>
          <SkiaImage image={image} x={x + shift} y={y} width={w} height={h} fit="cover">
            <ColorMatrix matrix={[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]} />
          </SkiaImage>
          <SkiaImage image={image} x={x - shift} y={y} width={w} height={h} fit="cover">
            <ColorMatrix matrix={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]} />
          </SkiaImage>
        </Group>
      )}
    </Group>
  );
}

function renderEffectLayer(
  settings: CameraPreset['settings'],
  leakParams: {
    startFX: number;
    startFY: number;
    endFX: number;
    endFY: number;
    colors: string[];
    coreFX?: number;
    coreFY?: number;
    coreColors?: string[];
  } | null,
  uri: string,
  x: number,
  y: number,
  w: number,
  h: number,
  halationCenter?: LuminancePeak
) {
  // Resolution-adaptive frequencies
  const resFactor = Math.max(1, w / 390);
  const sqrtRes = Math.sqrt(resFactor);
  const grainFreq = 0.75 / sqrtRes;
  const dustFreq = 0.9 / sqrtRes;
  const scratchFreqX = 0.01 / sqrtRes;
  const scratchFreqY = 0.8 / sqrtRes;
  const hc = halationCenter ?? { x: 0.5, y: 0.28, luminance: 0.5 };

  return (
    <Group>
      {settings.tintOpacity > 0 && (
        <Group blendMode="softLight">
          <Rect x={x} y={y} width={w} height={h} color={settings.tint} opacity={Math.min(0.35, settings.tintOpacity * 1.25)} />
        </Group>
      )}
      {settings.vignette > 0 && (
        <Rect x={x} y={y} width={w} height={h}>
          <RadialGradient
            c={vec(x + w / 2, y + h / 2)}
            r={Math.max(w, h) * 0.72}
            colors={['transparent', `rgba(0,0,0,${settings.vignette * 0.85})`]}
          />
        </Rect>
      )}
      {/* Photographic Organic Light Leak with Hot Core Burst */}
      {leakParams && (
        <Group blendMode="screen">
          <Rect x={x} y={y} width={w} height={h}>
            <SkiaLinearGradient
              start={vec(x + w * leakParams.startFX, y + h * leakParams.startFY)}
              end={vec(x + w * leakParams.endFX, y + h * leakParams.endFY)}
              colors={leakParams.colors}
            />
          </Rect>
          {leakParams.coreColors && (
            <Circle
              cx={x + w * (leakParams.coreFX ?? leakParams.startFX)}
              cy={y + h * (leakParams.coreFY ?? leakParams.startFY)}
              r={Math.max(w, h) * 0.42}
            >
              <RadialGradient
                c={vec(x + w * (leakParams.coreFX ?? leakParams.startFX), y + h * (leakParams.coreFY ?? leakParams.startFY))}
                r={Math.max(w, h) * 0.42}
                colors={leakParams.coreColors}
              />
            </Circle>
          )}
        </Group>
      )}
      {settings.halation > 0 && (
        <Group blendMode="screen">
          <Rect x={x} y={y} width={w} height={h}>
            <RadialGradient
              c={vec(x + w * hc.x, y + h * hc.y)}
              r={Math.max(w, h) * (0.45 + hc.luminance * 0.15)}
              colors={[
                `rgba(255,65,20,${settings.halation * 0.25 * (0.6 + hc.luminance * 0.4)})`,
                `rgba(255,40,10,${settings.halation * 0.08})`,
                'transparent',
              ]}
              positions={[0, 0.45, 1]}
            />
          </Rect>
        </Group>
      )}
      {settings.flash > 0 && (
        <Group blendMode="softLight" opacity={Math.min(0.6, settings.flash * 0.5)}>
          <Rect x={x} y={y} width={w} height={h}>
            <RadialGradient
              c={vec(x + w / 2, y + h * 0.42)}
              r={Math.min(w, h) * 0.58}
              colors={[settings.flashColor || '#FFFFF4', 'rgba(255,255,240,0.2)', 'transparent']}
              positions={[0, 0.55, 1]}
            />
          </Rect>
        </Group>
      )}
      {/* 100% Monochrome Silver Halide Film Grain (zero rainbow RGB noise) */}
      {settings.grain > 0 && (
        <Group blendMode="softLight" opacity={settings.grain * 0.42}>
          <Rect x={x} y={y} width={w} height={h}>
            <Turbulence freqX={grainFreq} freqY={grainFreq} octaves={1} seed={getSeedFromUri(uri)} />
            <ColorMatrix
              matrix={[
                0.35, 0.35, 0.30, 0, 0.15,
                0.35, 0.35, 0.30, 0, 0.15,
                0.35, 0.35, 0.30, 0, 0.15,
                0,    0,    0,    0, 1,
              ]}
            />
          </Rect>
        </Group>
      )}
      {/* 100% Monochrome Silver Film Dust & Micro-Scratches (zero neon RGB confetti) */}
      {settings.dust > 0 && (
        <>
          <Group blendMode="screen" opacity={settings.dust * 0.38}>
            <Rect x={x} y={y} width={w} height={h}>
              <Turbulence freqX={dustFreq} freqY={dustFreq} octaves={1} seed={getSeedFromUri(uri) + 1} />
              <ColorMatrix
                matrix={[
                  12, 0, 0, 0, -10.6,
                  12, 0, 0, 0, -10.6,
                  12, 0, 0, 0, -10.6,
                  12, 0, 0, 0, -10.6,
                ]}
              />
            </Rect>
          </Group>
          {settings.dust >= 0.2 && (
            <Group blendMode="screen" opacity={settings.dust * 0.18}>
              <Rect x={x} y={y} width={w} height={h}>
                <Turbulence freqX={scratchFreqX} freqY={scratchFreqY} octaves={1} seed={getSeedFromUri(uri) + 2} />
                <ColorMatrix
                  matrix={[
                    14, 0, 0, 0, -13.1,
                    14, 0, 0, 0, -13.1,
                    14, 0, 0, 0, -13.1,
                    14, 0, 0, 0, -13.1,
                  ]}
                />
              </Rect>
            </Group>
          )}
        </>
      )}
    </Group>
  );
}

function renderVintageDateStamp(
  timestampStr: string,
  font: SkFont | null,
  x: number,
  y: number,
  scale: number
) {
  if (!font) return null;
  return (
    <Group>
      {/* Drop shadow */}
      <SkiaText
        text={timestampStr}
        font={font}
        x={x + 1.2 * scale}
        y={y + 1.2 * scale}
        color="rgba(0,0,0,0.85)"
      />
      {/* Amber quartz foreground */}
      <SkiaText
        text={timestampStr}
        font={font}
        x={x}
        y={y}
        color="rgba(255,180,50,0.95)"
      />
    </Group>
  );
}

function renderRetroCamWatermark(
  font: SkFont | null,
  x: number,
  y: number,
  scale: number,
  isDark = false
) {
  if (!font) return null;
  if (isDark) {
    return (
      <SkiaText
        text="RetroCam AI"
        font={font}
        x={x}
        y={y}
        color="rgba(0,0,0,0.3)"
      />
    );
  }
  return (
    <Group>
      <SkiaText
        text="RetroCam AI"
        font={font}
        x={x + 1 * scale}
        y={y + 1 * scale}
        color="rgba(0,0,0,0.6)"
      />
      <SkiaText
        text="RetroCam AI"
        font={font}
        x={x}
        y={y}
        color="rgba(255,255,255,0.45)"
      />
    </Group>
  );
}

function renderCamcorderHUD(
  width: number,
  height: number,
  scale: number,
  timestampStr: string,
  hasTimestamp: boolean,
  monoFontSm: SkFont | null
) {
  if (!monoFontSm) return null;
  const timecodeStr = hasTimestamp
    ? `${timestampStr}  ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:${String(new Date().getSeconds()).padStart(2, '0')}`
    : 'TC 12:34:56';

  const spText = 'SP  Hi8';
  const spW = getTextWidth(monoFontSm, spText);

  return (
    <Group>
      {/* Scanlines */}
      {Array.from({ length: Math.floor(height / (5 * scale)) }).map((_, i) => (
        <Rect
          key={`cscan_${i}`}
          x={0}
          y={i * 5 * scale}
          width={width}
          height={Math.max(1, Math.round(1 * scale))}
          color="rgba(0,0,0,0.05)"
        />
      ))}

      {/* Top Bar */}
      <Rect x={0} y={0} width={width} height={28 * scale} color="rgba(0,0,0,0.5)" />

      {/* REC Red Dot & Text */}
      <Circle cx={14 * scale} cy={14 * scale} r={4 * scale} color="#FF3B30" />
      <SkiaText
        text="REC"
        font={monoFontSm}
        x={22 * scale}
        y={18 * scale}
        color="rgba(255,60,60,0.95)"
      />

      {/* Format indicator: SP Hi8 */}
      <SkiaText
        text={spText}
        font={monoFontSm}
        x={(width - spW) / 2}
        y={18 * scale}
        color="rgba(255,255,255,0.75)"
      />

      {/* 3-segment Battery on right */}
      <RoundedRect
        x={width - 36 * scale}
        y={9 * scale}
        width={20 * scale}
        height={10 * scale}
        r={1.5 * scale}
        style="stroke"
        strokeWidth={Math.max(1, 1.2 * scale)}
        color="rgba(255,255,255,0.8)"
      />
      <RoundedRect
        x={width - 34 * scale}
        y={11 * scale}
        width={4 * scale}
        height={6 * scale}
        r={0.5 * scale}
        color="#34C759"
      />
      <RoundedRect
        x={width - 29 * scale}
        y={11 * scale}
        width={4 * scale}
        height={6 * scale}
        r={0.5 * scale}
        color="#34C759"
      />
      <RoundedRect
        x={width - 24 * scale}
        y={11 * scale}
        width={4 * scale}
        height={6 * scale}
        r={0.5 * scale}
        color="#34C759"
      />
      <RoundedRect
        x={width - 15.5 * scale}
        y={11.5 * scale}
        width={2.5 * scale}
        height={5 * scale}
        r={1 * scale}
        color="rgba(255,255,255,0.7)"
      />

      {/* Bottom Bar */}
      <Rect x={0} y={height - 28 * scale} width={width} height={28 * scale} color="rgba(0,0,0,0.5)" />

      {/* Timecode / Timestamp */}
      <SkiaText
        text={timecodeStr}
        font={monoFontSm}
        x={10 * scale}
        y={height - 10 * scale}
        color="rgba(255,255,255,0.85)"
      />

      {/* Zoom track */}
      <SkiaText
        text="W"
        font={monoFontSm}
        x={width - 110 * scale}
        y={height - 10 * scale}
        color="rgba(255,255,255,0.6)"
      />
      <RoundedRect
        x={width - 98 * scale}
        y={height - 15.5 * scale}
        width={80 * scale}
        height={3 * scale}
        r={1.5 * scale}
        color="rgba(255,255,255,0.25)"
      />
      <RoundedRect
        x={width - 98 * scale}
        y={height - 15.5 * scale}
        width={36 * scale}
        height={3 * scale}
        r={1.5 * scale}
        color="rgba(255,255,255,0.75)"
      />
      <SkiaText
        text="T"
        font={monoFontSm}
        x={width - 14 * scale}
        y={height - 10 * scale}
        color="rgba(255,255,255,0.6)"
      />
    </Group>
  );
}

function renderDigitalHUD(
  width: number,
  height: number,
  scale: number,
  timestampStr: string,
  hasTimestamp: boolean,
  monoFontSm: SkFont | null
) {
  if (!monoFontSm) return null;
  const hqText = 'HQ 3.2M';
  const hqW = getTextWidth(monoFontSm, hqText);
  const memText = '[ 128MB ]';
  const memW = getTextWidth(monoFontSm, memText);

  return (
    <Group>
      {/* Top Bar */}
      <Rect x={0} y={0} width={width} height={22 * scale} color="rgba(0,0,0,0.55)" />
      <SkiaText
        text="[+] AUTO"
        font={monoFontSm}
        x={10 * scale}
        y={15 * scale}
        color="#00FF66"
      />
      <SkiaText
        text={hqText}
        font={monoFontSm}
        x={(width - hqW) / 2}
        y={15 * scale}
        color="rgba(255,255,255,0.85)"
      />

      {/* Battery icon */}
      <RoundedRect
        x={width - 32 * scale}
        y={6 * scale}
        width={18 * scale}
        height={9 * scale}
        r={1 * scale}
        style="stroke"
        strokeWidth={Math.max(1, 1 * scale)}
        color="#00FF66"
      />
      <RoundedRect
        x={width - 30 * scale}
        y={8 * scale}
        width={12 * scale}
        height={5 * scale}
        r={0.5 * scale}
        color="#00FF66"
      />
      <RoundedRect
        x={width - 13.5 * scale}
        y={8 * scale}
        width={2 * scale}
        height={5 * scale}
        r={0.5 * scale}
        color="#00FF66"
      />

      {/* Center AF target */}
      <RoundedRect
        x={(width - 36 * scale) / 2}
        y={(height - 36 * scale) / 2}
        width={36 * scale}
        height={36 * scale}
        r={4 * scale}
        style="stroke"
        strokeWidth={Math.max(1, 1.2 * scale)}
        color="rgba(0,255,102,0.4)"
      />

      {/* Bottom Bar */}
      <Rect x={0} y={height - 22 * scale} width={width} height={22 * scale} color="rgba(0,0,0,0.55)" />
      <SkiaText
        text="ISO 400"
        font={monoFontSm}
        x={10 * scale}
        y={height - 7 * scale}
        color="#00FF66"
      />
      <SkiaText
        text={memText}
        font={monoFontSm}
        x={(width - memW) / 2}
        y={height - 7 * scale}
        color="rgba(255,255,255,0.75)"
      />
      {hasTimestamp && (
        <SkiaText
          text={timestampStr}
          font={monoFontSm}
          x={width - 10 * scale - getTextWidth(monoFontSm, timestampStr)}
          y={height - 7 * scale}
          color="#00FF66"
        />
      )}
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────
//  FilteredSceneContent — Unified Skia Render Tree
// ─────────────────────────────────────────────────────────────

export interface FilteredSceneContentProps {
  image: SkImage;
  secondaryImage: SkImage | null;
  settings: CameraPreset['settings'];
  frameType: CameraPreset['frameType'];
  colorMatrix: number[];
  timestampStr: string;
  leakParams: {
    startFX: number;
    startFY: number;
    endFX: number;
    endFY: number;
    colors: string[];
    coreFX?: number;
    coreFY?: number;
    coreColors?: string[];
  } | null;
  showWatermark: boolean;
  width: number;
  height: number;
  scale: number;
  uri: string;
  lens?: LensType;
  filterOpacity?: number;
  halationCenter?: LuminancePeak;
  specularPeaks?: LuminancePeak[];
}

export function FilteredSceneContent({
  image,
  secondaryImage,
  settings,
  frameType,
  colorMatrix,
  timestampStr,
  leakParams,
  showWatermark,
  width,
  height,
  scale,
  uri,
  lens = 'prime',
  filterOpacity = 1.0,
  halationCenter,
  specularPeaks,
}: FilteredSceneContentProps) {
  const monoFont = useMemo(
    () => getSafeFont(Math.max(9, Math.round(12 * scale)), { isMono: true, fontWeight: 'bold' }),
    [scale]
  );
  const monoFontSm = useMemo(
    () => getSafeFont(Math.max(8, Math.round(10 * scale)), { isMono: true, fontWeight: 'normal' }),
    [scale]
  );
  const sansFont = useMemo(
    () => getSafeFont(Math.max(8, Math.round(11 * scale)), { isMono: false, fontWeight: 'bold' }),
    [scale]
  );

  const peaks = useMemo(() => {
    if (halationCenter && specularPeaks) {
      return { halationCenter, specularPeaks };
    }
    return detectLuminancePeaks(image);
  }, [image, halationCenter, specularPeaks]);

  const activeHalationCenter = halationCenter ?? peaks.halationCenter;
  const activeSpecularPeaks = specularPeaks ?? peaks.specularPeaks;

  // Common coordinates for normal frames
  const dateW = getTextWidth(monoFont, timestampStr);
  const dateX = width - 14 * scale - dateW;
  const dateY = height - 20 * scale;

  const wmText = 'RetroCam AI';
  const wmW = getTextWidth(sansFont, wmText);
  const wmX = width - 14 * scale - wmW;
  const wmY = height - 44 * scale;

  // ── POLAROID ──
  if (frameType === 'polaroid') {
    const pb = Math.round(width * 0.05);
    const pbot = Math.round(width * 0.18);
    const imgW = width - pb * 2;
    const imgH = height - pb - pbot;

    const pDateX = pb + imgW - 8 * scale - dateW;
    const pDateY = pb + imgH - 8 * scale;
    const pWmX = (width - wmW) / 2;
    const pWmY = pb + imgH + Math.round(pbot * 0.7);

    return (
      <Group>
        <Rect x={0} y={0} width={width} height={height} color="#FFFFFF" />
        <Group clip={{ x: pb, y: pb, width: imgW, height: imgH }}>
          <SkiaImage image={image} x={pb} y={pb} width={imgW} height={imgH} fit="cover" />
          <Group opacity={filterOpacity}>
            {renderImageLayer(image, secondaryImage, settings, colorMatrix, pb, pb, imgW, imgH, scale, lens, activeSpecularPeaks)}
            {renderEffectLayer(settings, leakParams, uri, pb, pb, imgW, imgH, activeHalationCenter)}
          </Group>
        </Group>
        <Rect
          x={pb}
          y={pb}
          width={imgW}
          height={imgH}
          color="rgba(0,0,0,0.08)"
          style="stroke"
          strokeWidth={Math.max(1, 1 * scale)}
        />
        {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, pDateX, pDateY, scale)}
        {showWatermark && renderRetroCamWatermark(sansFont, pWmX, pWmY, scale, true)}
      </Group>
    );
  }

  // ── HALF-FRAME ──
  if (frameType === 'half-frame') {
    const halfW = Math.floor(width / 2) - Math.round(6 * scale);
    return (
      <Group>
        <Rect x={0} y={0} width={width} height={height} color="#000000" />
        {/* Left panel */}
        <Group clip={{ x: 4 * scale, y: 0, width: halfW, height }}>
          <SkiaImage image={image} x={4 * scale} y={0} width={halfW} height={height} fit="cover" />
          <Group opacity={filterOpacity}>
            {renderImageLayer(image, secondaryImage, settings, colorMatrix, 4 * scale, 0, halfW, height, scale, lens, activeSpecularPeaks)}
            {renderEffectLayer(settings, leakParams, uri, 4 * scale, 0, halfW, height, activeHalationCenter)}
          </Group>
        </Group>
        {/* Right panel */}
        <Group clip={{ x: halfW + 8 * scale, y: 0, width: halfW, height }}>
          <SkiaImage image={image} x={halfW + 8 * scale} y={0} width={halfW} height={height} fit="cover" />
          <Group opacity={filterOpacity}>
            {renderImageLayer(image, secondaryImage, settings, colorMatrix, halfW + 8 * scale, 0, halfW, height, scale, lens, activeSpecularPeaks)}
            {renderEffectLayer(settings, leakParams, uri, halfW + 8 * scale, 0, halfW, height, activeHalationCenter)}
          </Group>
        </Group>
        {/* Divider line */}
        <Rect x={halfW + 4 * scale} y={0} width={4 * scale} height={height} color="#111111" />
        {/* Sprocket holes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <RoundedRect
            key={`hl_${i}`}
            x={2 * scale}
            y={i * (height / 8) + 4 * scale}
            width={8 * scale}
            height={height / 8 - 8 * scale}
            r={2 * scale}
            color="#1A1A1A"
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <RoundedRect
            key={`hr_${i}`}
            x={width - 10 * scale}
            y={i * (height / 8) + 4 * scale}
            width={8 * scale}
            height={height / 8 - 8 * scale}
            r={2 * scale}
            color="#1A1A1A"
          />
        ))}
        {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, dateX, dateY, scale)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── 8mm / 16mm ──
  if (frameType === '8mm' || frameType === '16mm') {
    const sw = Math.round((frameType === '16mm' ? 28 : 22) * scale);
    const innerW = width - sw * 2;
    return (
      <Group>
        <Rect x={0} y={0} width={width} height={height} color="#0A0A0A" />
        <Group clip={{ x: sw, y: 0, width: innerW, height }}>
          <SkiaImage image={image} x={sw} y={0} width={innerW} height={height} fit="cover" />
          <Group opacity={filterOpacity}>
            {renderImageLayer(image, secondaryImage, settings, colorMatrix, sw, 0, innerW, height, scale, lens, activeSpecularPeaks)}
            {renderEffectLayer(settings, leakParams, uri, sw, 0, innerW, height, activeHalationCenter)}
          </Group>
        </Group>
        {/* Left sprocket strip */}
        <Rect x={0} y={0} width={sw} height={height} color="#111111" />
        {Array.from({ length: 10 }).map((_, i) => (
          <RoundedRect
            key={`spl_${i}`}
            x={3 * scale}
            y={i * (height / 10) + 3 * scale}
            width={sw - 6 * scale}
            height={height / 10 - 6 * scale}
            r={2 * scale}
            color="#222222"
          />
        ))}
        {/* Right sprocket strip */}
        <Rect x={width - sw} y={0} width={sw} height={height} color="#111111" />
        {Array.from({ length: 10 }).map((_, i) => (
          <RoundedRect
            key={`spr_${i}`}
            x={width - sw + 3 * scale}
            y={i * (height / 10) + 3 * scale}
            width={sw - 6 * scale}
            height={height / 10 - 6 * scale}
            r={2 * scale}
            color="#222222"
          />
        ))}
        {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, dateX, dateY, scale)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── FISHEYE ──
  if (frameType === 'fisheye') {
    const fishR = Math.min(width, height) * 0.46;
    const cx = width / 2;
    const cy = height / 2;
    return (
      <Group>
        <Rect x={0} y={0} width={width} height={height} color="#000000" />
        <Group clip={{ x: cx - fishR, y: cy - fishR, width: fishR * 2, height: fishR * 2 }}>
          <SkiaImage image={image} x={cx - fishR} y={cy - fishR} width={fishR * 2} height={fishR * 2} fit="cover" />
          <Group opacity={filterOpacity}>
            {renderImageLayer(image, secondaryImage, settings, colorMatrix, cx - fishR, cy - fishR, fishR * 2, fishR * 2, scale, lens, activeSpecularPeaks)}
            {renderEffectLayer(settings, leakParams, uri, cx - fishR, cy - fishR, fishR * 2, fishR * 2, activeHalationCenter)}
          </Group>
        </Group>
        <Circle
          cx={cx}
          cy={cy}
          r={fishR}
          color="rgba(0,0,0,0.4)"
          style="stroke"
          strokeWidth={Math.max(1, 4 * scale)}
        />
        {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, dateX, dateY, scale)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── CAMCORDER ──
  if (frameType === 'camcorder') {
    return (
      <Group>
        <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover" />
        <Group opacity={filterOpacity}>
          {renderImageLayer(image, secondaryImage, settings, colorMatrix, 0, 0, width, height, scale, lens, activeSpecularPeaks)}
          {renderEffectLayer(settings, leakParams, uri, 0, 0, width, height, activeHalationCenter)}
        </Group>
        {renderCamcorderHUD(width, height, scale, timestampStr, !!settings.timestamp, monoFontSm)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── VHS ──
  if (frameType === 'vhs') {
    return (
      <Group>
        <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover" />
        <Group opacity={filterOpacity}>
          {renderImageLayer(image, secondaryImage, settings, colorMatrix, 0, 0, width, height, scale, lens, activeSpecularPeaks)}
          {renderEffectLayer(settings, leakParams, uri, 0, 0, width, height, activeHalationCenter)}
        </Group>
        {/* Scanlines */}
        {Array.from({ length: Math.floor(height / (4 * scale)) }).map((_, i) => (
          <Rect
            key={`vscan_${i}`}
            x={0}
            y={i * 4 * scale}
            width={width}
            height={Math.max(1, 1 * scale)}
            color="rgba(0,0,0,0.07)"
          />
        ))}
        {/* VHS Magnetic Tape Bottom Tracking Jitter Bar */}
        <Rect x={0} y={height - 14 * scale} width={width} height={4 * scale} color="rgba(0,0,0,0.18)" />
        <Rect x={0} y={height - 11 * scale} width={width} height={1.5 * scale} color="rgba(255,255,255,0.08)" />
        {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, dateX, dateY, scale)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── DIGITAL ──
  if (frameType === 'digital') {
    return (
      <Group>
        <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover" />
        <Group opacity={filterOpacity}>
          {renderImageLayer(image, secondaryImage, settings, colorMatrix, 0, 0, width, height, scale, lens, activeSpecularPeaks)}
          {renderEffectLayer(settings, leakParams, uri, 0, 0, width, height, activeHalationCenter)}
        </Group>
        {renderDigitalHUD(width, height, scale, timestampStr, !!settings.timestamp, monoFontSm)}
        {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
      </Group>
    );
  }

  // ── DISPOSABLE / DEFAULT ──
  return (
    <Group>
      <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover" />
      <Group opacity={filterOpacity}>
        {renderImageLayer(image, secondaryImage, settings, colorMatrix, 0, 0, width, height, scale, lens, activeSpecularPeaks)}
        {renderEffectLayer(settings, leakParams, uri, 0, 0, width, height, activeHalationCenter)}
      </Group>
      {settings.timestamp && renderVintageDateStamp(timestampStr, monoFont, dateX, dateY, scale)}
      {showWatermark && renderRetroCamWatermark(sansFont, wmX, wmY, scale)}
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────
//  FilteredImage Component
// ─────────────────────────────────────────────────────────────

export const FilteredImage = forwardRef<FilteredImageRef, FilteredImageProps>(function FilteredImage(
  {
    uri,
    secondaryUri,
    preset,
    width,
    height,
    showWatermark = false,
    overrides = {},
    aspectRatio = 'full',
    lens = 'prime',
    filterOpacity = 1.0,
  },
  ref
) {
  const image = useImage(uri);
  const secondaryImage = useImage(secondaryUri || undefined);
  const canvasRef = useCanvasRef();
  const settings = useMemo(
    () => ({ ...preset.settings, ...overrides }),
    [preset.settings, overrides]
  );
  const { frameType } = preset;

  const colorMatrix = useMemo(
    () => buildColorMatrix(settings),
    [settings]
  );

  const { halationCenter, specularPeaks } = useMemo(
    () => detectLuminancePeaks(image),
    [image]
  );

  const timestampStr = useMemo(() => {
    if (settings.retroDate) return settings.retroDate;
    const seed = getSeedFromUri(uri);
    const rand = seededRandom(seed);
    const year = 1990 + Math.floor(rand() * 10);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${mm}/${dd}/'${yy}`;
  }, [settings.retroDate, uri]);

  const leakParams = useMemo(() => {
    if (settings.lightLeak <= 0) return null;
    const seed = getSeedFromUri(uri);
    const rand = seededRandom(seed);
    const leakType = Math.floor(rand() * 4);

    let startFX = 0;
    let startFY = 0;
    let endFX = 0.7;
    let endFY = 0.55;
    let colors = [`rgba(255,145,50,${settings.lightLeak * 0.45})`, 'transparent'];
    let coreFX = 0.15;
    let coreFY = 0.15;
    let coreColors = [`rgba(255,235,170,${settings.lightLeak * 0.6})`, 'transparent'];

    if (leakType === 1) {
      startFX = 1;
      startFY = 0;
      endFX = 0.3;
      endFY = 0.6;
      colors = [`rgba(255,120,40,${settings.lightLeak * 0.45})`, 'transparent'];
      coreFX = 0.85;
      coreFY = 0.15;
      coreColors = [`rgba(255,230,150,${settings.lightLeak * 0.6})`, 'transparent'];
    } else if (leakType === 2) {
      startFX = 0;
      startFY = 1;
      endFX = 0.6;
      endFY = 0.4;
      colors = [`rgba(255,175,45,${settings.lightLeak * 0.45})`, 'transparent'];
      coreFX = 0.15;
      coreFY = 0.85;
      coreColors = [`rgba(255,245,170,${settings.lightLeak * 0.6})`, 'transparent'];
    } else if (leakType === 3) {
      startFX = 1;
      startFY = 1;
      endFX = 0.4;
      endFY = 0.5;
      colors = [`rgba(240,80,35,${settings.lightLeak * 0.45})`, 'transparent'];
      coreFX = 0.85;
      coreFY = 0.85;
      coreColors = [`rgba(255,160,90,${settings.lightLeak * 0.6})`, 'transparent'];
    }
    return { startFX, startFY, endFX, endFY, colors, coreFX, coreFY, coreColors };
  }, [settings.lightLeak, uri]);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      try {
        if (!image) {
          // If image has not loaded, fallback to onscreen canvas snapshot if present
          const snapshot = await canvasRef.current?.makeImageSnapshotAsync();
          if (!snapshot) return null;
          let base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 92);
          try {
            base64 = await injectExifFromOriginal(base64, uri);
          } catch (exifErr) {
            console.warn('[RetroCam] Failed to inject EXIF metadata:', exifErr);
          }
          const filename = `retrocam_filtered_${Date.now()}.jpg`;
          const fileUri = (FileSystem.documentDirectory ?? '') + filename;
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return fileUri;
        }

        const nativeW = image.width();
        const nativeH = image.height();
        const { width: exportW, height: exportH } = getAspectDimensions(
          nativeW,
          nativeH,
          aspectRatio,
          4096
        );
        const exportScale = exportW / 390;

        let snapshot: SkImage | null = null;

        // Multi-resolution export ladder: 4096px (Tier 1 GPU -> Tier 2 CPU) -> 2560px (Tier 2b) -> 2048px (Tier 2c)
        const ladderDimensions = [4096, 2560, 2048];
        for (const targetDim of ladderDimensions) {
          const { width: curW, height: curH } = getAspectDimensions(
            nativeW,
            nativeH,
            aspectRatio,
            targetDim
          );
          const curScale = curW / 390;

          const sceneElement = (
            <FilteredSceneContent
              image={image}
              secondaryImage={secondaryImage}
              settings={settings}
              frameType={frameType}
              colorMatrix={colorMatrix}
              timestampStr={timestampStr}
              leakParams={leakParams}
              showWatermark={showWatermark}
              width={curW}
              height={curH}
              scale={curScale}
              uri={uri}
              lens={lens}
              filterOpacity={filterOpacity}
              halationCenter={halationCenter}
              specularPeaks={specularPeaks}
            />
          );

          try {
            const picture = await drawAsPicture(sceneElement, {
              x: 0,
              y: 0,
              width: curW,
              height: curH,
            });

            // Tier 1: GPU-backed offscreen surface at target dimension
            let surface: SkSurface | null = null;
            try {
              surface = Skia.Surface.MakeOffscreen(curW, curH);
            } catch (gpuErr) {
              console.warn(`Skia.Surface.MakeOffscreen failed at ${curW}x${curH}:`, gpuErr);
            }

            // Tier 2: CPU raster surface fallback at target dimension
            if (!surface) {
              try {
                surface = Skia.Surface.Make(curW, curH);
              } catch (cpuErr) {
                console.warn(`Skia.Surface.Make failed at ${curW}x${curH}:`, cpuErr);
              }
            }

            // Tier 2b / 2c: intermediate resolution surface fallback if 4096 failed
            if (!surface && (curW !== exportW || curH !== exportH)) {
              try {
                surface = Skia.Surface.MakeOffscreen(curW, curH) ?? Skia.Surface.Make(curW, curH);
              } catch {}
            }

            if (surface) {
              const canvas = surface.getCanvas();
              canvas.drawPicture(picture);
              surface.flush();
              snapshot = surface.makeImageSnapshot();
              if (snapshot) break;
            }
          } catch (offscreenErr) {
            console.warn(`Offscreen export failed at dimension ${targetDim}:`, offscreenErr);
          }
        }

        // Tier 3: Onscreen canvas snapshot fallback
        if (!snapshot && canvasRef.current) {
          snapshot = await canvasRef.current.makeImageSnapshotAsync();
        }

        if (!snapshot) return null;

        let base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 92);
        try {
          base64 = await injectExifFromOriginal(base64, uri);
        } catch (exifErr) {
          console.warn('[RetroCam] Failed to inject EXIF metadata:', exifErr);
        }

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

  if (!image) {
    return <View style={{ width, height, backgroundColor: '#000' }} />;
  }

  const previewScale = width / 390;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: frameType === 'disposable' ? 8 : 0,
        overflow: 'hidden',
      }}
    >
      <Canvas ref={canvasRef} style={{ width, height }}>
        <FilteredSceneContent
          image={image}
          secondaryImage={secondaryImage}
          settings={settings}
          frameType={frameType}
          colorMatrix={colorMatrix}
          timestampStr={timestampStr}
          leakParams={leakParams}
          showWatermark={showWatermark}
          width={width}
          height={height}
          scale={previewScale}
          uri={uri}
          lens={lens}
          filterOpacity={filterOpacity}
          halationCenter={halationCenter}
          specularPeaks={specularPeaks}
        />
      </Canvas>
    </View>
  );
});

