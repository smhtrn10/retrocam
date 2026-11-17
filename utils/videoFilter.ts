import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraSettings } from '@/constants/presets';

/**
 * Builds FFmpeg filter using ONLY universally supported filters.
 *
 * IMPORTANT: 'eq' filter is NOT available in kroog-ffmpeg-kit-react-native fork.
 * Replacements:
 *   - eq(brightness/contrast) → colorlevels
 *   - eq(saturation)          → hue=s=
 */

/**
 * Universal safe system font candidates across Android and iOS.
 * Eliminates deprecated / crashing fonts like /system/fonts/DroidSansMono.ttf.
 */
export const FONT_CANDIDATES = {
  android: [
    '/system/fonts/Roboto-Regular.ttf',
    '/system/fonts/RobotoMono-Regular.ttf',
    '/system/fonts/DroidSans.ttf',
    '/system/fonts/NotoSansCJK-Regular.ttc',
    '/system/fonts/NotoSans-Regular.ttf',
  ],
  ios: [
    '/System/Library/Fonts/Core/Courier.ttc',
    '/System/Library/Fonts/Courier.ttc',
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/Core/Helvetica.ttc',
    '/System/Library/Fonts/SFCompact.ttf',
    '/System/Library/Fonts/Supplemental/Courier New.ttf',
  ],
};

let cachedFontPath: string | null | undefined = undefined;

/**
 * Clears the in-memory font path cache (useful for testing and environment resets).
 */
export function resetFontCache(): void {
  cachedFontPath = undefined;
}

/**
 * Probes candidate system font paths using FileSystem.getInfoAsync.
 * Returns the first verified existing POSIX path on disk, or null if none exist.
 */
export async function resolveSafeFontPath(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && cachedFontPath !== undefined) {
    return cachedFontPath;
  }

  const candidates = Platform.OS === 'ios'
    ? FONT_CANDIDATES.ios
    : Platform.OS === 'android'
      ? FONT_CANDIDATES.android
      : [];

  for (const path of candidates) {
    try {
      const uri = path.startsWith('file://') ? path : `file://${path}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info && info.exists) {
        cachedFontPath = path;
        return path;
      }
    } catch {
      // Continue probing next candidate
    }
  }

  cachedFontPath = null;
  return null;
}

/**
 * Safely clamps a numeric value to [min, max] range with fallback for NaN / undefined / non-number.
 */
function safeClamp(val: any, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}

/**
 * Parses hex color string (#RRGGBB or #RGB) into RGB components.
 */
function hexToRgb(hex?: string) {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.trim().replace(/^#/, '');
  let fullHex = cleanHex;
  if (fullHex.length === 3) {
    fullHex = fullHex.split('').map((c) => c + c).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Escapes characters that break FFmpeg filtergraph string literals.
 */
function escapeFFmpegText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeFFmpegFontPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/'/g, "\\'");
}

export type VideoEffectMode = 'none' | 'vhs' | 'glitch' | 'rgb';

/**
 * Builds FFmpeg filter graph string with guaranteed parameter clamping.
 * Omits drawtext when fontFile is null, undefined, or empty.
 */
export function buildVideoFilter(
  settings: CameraSettings,
  dateStr?: string,
  fontFile?: string | null,
  videoEffect: VideoEffectMode = 'none',
  includeAdvanced = true
): string {
  const filters: string[] = [];
  const s = settings || ({} as Partial<CameraSettings>);

  // ── 1. colorlevels: contrast + fade (black lift) + S-curve toe/shoulder ──
  const contrast = safeClamp(s.contrast, 0.5, 2.0, 1.0);
  const fade = safeClamp(s.fade, 0, 1.0, 0);
  const sCurve = safeClamp(s.sCurve, 0, 1.0, 0);

  if (contrast !== 1.0 || fade > 0.02 || sCurve > 0.05 || videoEffect === 'vhs' || videoEffect === 'glitch') {
    const effectiveContrast = videoEffect === 'glitch' ? Math.max(contrast, 1.22) : contrast;
    const effectiveFade = videoEffect === 'vhs' ? Math.max(fade, 0.12) : fade;
    const contrastMargin = effectiveContrast > 1.0
      ? safeClamp((effectiveContrast - 1) * 0.16 + sCurve * 0.05, 0, 0.35, 0)
      : safeClamp((1 - effectiveContrast) * 0.15, 0, 0.4, 0);
    const blackLift = safeClamp(effectiveFade * 0.14 + sCurve * 0.03, 0, 0.5, 0);
    const rimin = contrastMargin.toFixed(3);
    const rimax = safeClamp(1 - contrastMargin, 0.1, 1.0, 1.0).toFixed(3);
    const romin = blackLift.toFixed(3);
    filters.push(
      `colorlevels=rimin=${rimin}:gimin=${rimin}:bimin=${rimin}` +
      `:rimax=${rimax}:gimax=${rimax}:bimax=${rimax}` +
      `:romin=${romin}:gomin=${romin}:bomin=${romin}`
    );
  }

  // ── 2. hue: saturation + temperature ──
  const sat = safeClamp(s.saturation, 0, 3.0, 1.0);
  const temp = safeClamp(s.temperature, -1.0, 1.0, 0);
  const hasTemp = Math.abs(temp) > 0.05;

  if (sat !== 1.0 || hasTemp) {
    const hueShift = hasTemp ? (temp * 6).toFixed(1) : '0';
    filters.push(`hue=s=${sat.toFixed(3)}:H=${hueShift}`);
  }

  // ── 3. Tint & Color Temperature Balance via colorchannelmixer ──
  const tintOpacity = safeClamp(s.tintOpacity, 0, 1.0, 0);
  if (tintOpacity > 0.02 || hasTemp) {
    const rgb = hexToRgb(s.tint) || { r: 255, g: 255, b: 255 };
    const a = safeClamp(tintOpacity * 0.35, 0, 0.35, 0);
    const tempR = temp > 0 ? temp * 0.08 : temp * 0.04;
    const tempB = temp < 0 ? -temp * 0.09 : -temp * 0.05;
    const rr = safeClamp((1 - a + a * (rgb.r / 255)) + tempR, 0.5, 1.25, 1.0).toFixed(4);
    const gg = safeClamp(1 - a + a * (rgb.g / 255), 0.5, 1.2, 1.0).toFixed(4);
    const bb = safeClamp((1 - a + a * (rgb.b / 255)) + tempB, 0.5, 1.25, 1.0).toFixed(4);
    filters.push(`colorchannelmixer=rr=${rr}:gg=${gg}:bb=${bb}`);
  }

  // ── 4. Chromatic Aberration / VHS RGB Shift (rgbashift) ──
  const rgbShift = safeClamp(s.rgbShift, 0, 1.0, 0);
  if (includeAdvanced && (rgbShift > 0.01 || videoEffect === 'rgb' || videoEffect === 'glitch' || videoEffect === 'vhs')) {
    let rh = Math.round(rgbShift * 80);
    let rv = 0;
    if (videoEffect === 'rgb') {
      rh = Math.max(rh, 5);
    } else if (videoEffect === 'glitch') {
      rh = Math.max(rh, 7);
      rv = 2;
    } else if (videoEffect === 'vhs') {
      rh = Math.max(rh, 3);
    }
    const shiftH = Math.max(2, Math.min(12, rh));
    filters.push(`rgbashift=rh=-${shiftH}:bh=${shiftH}:rv=${rv}:bv=-${rv}`);
  }

  // ── 5. Grain (Monochrome/Temporal Analog Noise) ──
  const grain = safeClamp(s.grain, 0, 1.0, 0);
  const effectiveGrain = videoEffect === 'vhs' || videoEffect === 'glitch' ? Math.max(grain, 0.35) : grain;
  if (effectiveGrain > 0.05) {
    const strength = safeClamp(Math.round(effectiveGrain * 22), 1, 40, 1);
    filters.push(`noise=alls=${strength}:allf=t+u`);
  }

  // ── 6. Blur ──
  const blur = safeClamp(s.blur, 0, 1.0, 0);
  if (blur > 0.1) {
    const sigma = safeClamp(blur * 2.5, 0.5, 10.0, 0.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── 7. Vignette ──
  const vignette = safeClamp(s.vignette, 0, 1.0, 0);
  if (vignette > 0.05) {
    const angle = safeClamp(vignette * 1.1, 0.05, 1.5, 0.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:eval=init`);
  }

  // ── 8. drawtext (safely omitted if fontFile is null/undefined or timestamp disabled) ──
  if (s.timestamp && dateStr && fontFile) {
    const escapedFont = escapeFFmpegFontPath(fontFile);
    const escapedText = escapeFFmpegText(dateStr);
    filters.push(
      `drawtext=fontfile='${escapedFont}':text='${escapedText}':x=w-tw-40:y=h-th-40:fontcolor=0xFFB800:fontsize=36:box=1:boxcolor=0x00000044:boxborderw=4`
    );
  }

  return filters.join(',');
}

/**
 * Returns FFmpeg args array safe for executeWithArguments / executeWithArgumentsAsync.
 * Omits drawtext when fontFile is null or undefined.
 */
export function buildFFmpegArgs(
  inputUri: string,
  outputUri: string,
  settings: CameraSettings,
  dateStr?: string,
  fontFile?: string | null,
  overlayPath?: string,
  videoEffect: VideoEffectMode = 'none'
): string[] {
  let effectiveDateStr = dateStr;
  let effectiveOverlayPath = overlayPath;
  const includeAdvanced = fontFile !== null;

  // Backwards compatibility: if 4th arg is an image file path and fontFile is unset
  if (dateStr && !fontFile && !overlayPath && /\.(png|jpe?g|webp)$/i.test(dateStr)) {
    effectiveOverlayPath = dateStr;
    effectiveDateStr = undefined;
  }

  // Effective font resolution:
  // If fontFile === null: explicitly omit drawtext (Tier 2 fallback)
  // If fontFile is provided: use provided string
  // If fontFile is undefined: use cachedFontPath if resolved, otherwise null (safely omit)
  const effectiveFont = fontFile !== undefined ? fontFile : (cachedFontPath ?? null);

  // Generate date string consistent with FilteredImage seed if timestamp is enabled
  if (settings && settings.timestamp && !effectiveDateStr) {
    const rawInput = (inputUri || 'video').split('/').pop() || 'video';
    let hash = 0;
    for (let i = 0; i < rawInput.length; i++) {
      hash = rawInput.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash) || 12345;
    let s = seed;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const year = 1990 + Math.floor(rand() * 10);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const yy = String(year).slice(-2);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    effectiveDateStr = settings.retroDate || `${mm}/${dd}/'${yy}`;
  }

  const baseArgs = [
    '-i', inputUri,
  ];

  if (effectiveOverlayPath) {
    baseArgs.push('-i', effectiveOverlayPath);
  }

  // Build filter graph
  if (effectiveOverlayPath) {
    const filter = buildVideoFilter(settings, undefined, null, videoEffect, includeAdvanced);
    let filterGraph = '';
    if (filter) {
      filterGraph = `[1:v]scale=iw:ih[ov];[0:v]${filter}[filtered];[filtered][ov]overlay=0:0`;
    } else {
      filterGraph = `[1:v]scale=iw:ih[ov];[0:v][ov]overlay=0:0`;
    }
    if (settings && settings.timestamp && effectiveDateStr && effectiveFont) {
      const escapedFont = escapeFFmpegFontPath(effectiveFont);
      const escapedText = escapeFFmpegText(effectiveDateStr);
      filterGraph += `,drawtext=fontfile='${escapedFont}':text='${escapedText}':x=w-tw-40:y=h-th-40:fontcolor=0xFFB800:fontsize=36:box=1:boxcolor=0x00000044:boxborderw=4`;
    }
    baseArgs.push('-filter_complex', filterGraph);
  } else {
    const vfFilters = buildVideoFilter(settings, effectiveDateStr, effectiveFont, videoEffect, includeAdvanced);
    if (vfFilters) {
      baseArgs.push('-vf', vfFilters);
    }
  }

  return [
    ...baseArgs,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    '-f', 'mp4',
    '-y',
    outputUri,
  ];
}
