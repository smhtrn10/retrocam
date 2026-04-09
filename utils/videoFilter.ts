import { CameraSettings } from '@/constants/presets';

/**
 * Builds FFmpeg filter using ONLY universally supported filters.
 *
 * IMPORTANT: 'eq' filter is NOT available in kroog-ffmpeg-kit-react-native fork.
 * Replacements:
 *   - eq(brightness/contrast) → colorlevels
 *   - eq(saturation)          → hue=s=
 */

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  const contrast = Math.max(0.5, Math.min(2.0, settings.contrast));
  const fade = Math.max(0, Math.min(1, settings.fade));

  // ── 1. colorlevels: contrast + fade (black lift) ──
  // FIX: clamp rimin to [0, 0.4] — colorlevels does NOT accept negative values
  if (contrast !== 1.0 || fade > 0.02) {
    const contrastMargin = Math.max(0, Math.min(0.4, (1 - contrast) * 0.15));
    const blackLift = Math.max(0, Math.min(0.5, fade * 0.12));
    const rimin = contrastMargin.toFixed(3);
    const rimax = Math.min(1.0, 1 - contrastMargin).toFixed(3);
    const romin = blackLift.toFixed(3);
    filters.push(
      `colorlevels=rimin=${rimin}:gimin=${rimin}:bimin=${rimin}` +
      `:rimax=${rimax}:gimax=${rimax}:bimax=${rimax}` +
      `:romin=${romin}:gomin=${romin}:bomin=${romin}`
    );
  }

  // ── 2. hue: saturation + temperature ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const hasTemp = Math.abs(settings.temperature) > 0.05;

  if (sat !== 1.0 || hasTemp) {
    const hueShift = hasTemp ? (settings.temperature * 8).toFixed(1) : '0';
    filters.push(`hue=s=${sat.toFixed(3)}:H=${hueShift}`);
  }

  // ── 3. Tint via colorchannelmixer ──
  if (settings.tintOpacity > 0.02) {
    const rgb = hexToRgb(settings.tint);
    if (rgb) {
      const a = Math.min(0.25, settings.tintOpacity * 0.25);
      const rr = (1 - a + a * (rgb.r / 255)).toFixed(4);
      const gg = (1 - a + a * (rgb.g / 255)).toFixed(4);
      const bb = (1 - a + a * (rgb.b / 255)).toFixed(4);
      filters.push(`colorchannelmixer=rr=${rr}:gg=${gg}:bb=${bb}`);
    }
  }

  // ── 4. Grain ──
  if (settings.grain > 0.05) {
    const strength = Math.min(40, Math.round(settings.grain * 20));
    filters.push(`noise=alls=${strength}:allf=a`);
  }

  // ── 5. Blur ──
  if (settings.blur > 0.1) {
    const sigma = Math.max(0.5, Math.min(10, settings.blur * 2.5)).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── 6. Vignette ──
  if (settings.vignette > 0.05) {
    const angle = Math.min(1.5, settings.vignette * 1.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:eval=init`);
  }

  return filters.join(',');
}

/**
 * Returns FFmpeg args as array — safe for executeWithArguments.
 * If no filters are needed, skips -vf entirely to avoid unnecessary re-encode overhead.
 */
export function buildFFmpegArgs(
  inputUri: string,
  outputUri: string,
  settings: CameraSettings
): string[] {
  const filter = buildVideoFilter(settings);

  const baseArgs = [
    '-i', inputUri,
  ];

  // Only add -vf if there are actual filters
  if (filter) {
    baseArgs.push('-vf', filter);
  }

  return [
    ...baseArgs,
    '-c:v', 'mpeg4',
    '-q:v', '5',
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
