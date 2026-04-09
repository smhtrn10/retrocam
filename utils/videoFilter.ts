import { CameraSettings } from '@/constants/presets';

/**
 * Builds FFmpeg filter using ONLY universally supported filters
 * in ffmpeg-kit video package:
 * - eq (saturation, contrast, brightness, gamma) ✅
 * - hue (color shift for temperature) ✅  
 * - noise ✅
 * - gblur ✅
 * - vignette ✅
 *
 * Removed risky filters: geq, curves (not in basic video package)
 * Re-added colorchannelmixer (standard in video package)
 */

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── 1. eq: saturation + contrast + brightness ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  const brightness = settings.fade > 0.02 ? (settings.fade * 0.08).toFixed(3) : '0';

  const gamma = settings.fade > 0.05 ? (1.0 - settings.fade * 0.15).toFixed(3) : '1.0';

  filters.push(
    `eq=saturation=${sat.toFixed(3)}:contrast=${contrast.toFixed(3)}:brightness=${brightness}:gamma=${gamma}`
  );

  // ── 2. Grain ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 20);
    filters.push(`noise=alls=${strength}:allf=a`);
  }

  // ── 3. Blur ──
  if (settings.blur > 0.1) {
    const sigma = Math.max(0.5, settings.blur * 2.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── 4. Vignette — eval=init for performance (calculated once, not per frame) ──
  if (settings.vignette > 0.05) {
    const angle = Math.min(1.5, settings.vignette * 1.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:eval=init`);
  }

  // ── 5. Color Correction (Temperature + Tint) ──
  // Using high-compatibility filters (hue, eq) instead of colorchannelmixer (KRİTİK #2)
  const hasTemp = Math.abs(settings.temperature) > 0.05;
  const hasTint = settings.tintOpacity > 0.02;

  if (hasTemp) {
    // hue is safe in all ffmpeg-kit packages
    const sat = settings.temperature > 0 ? 1 + settings.temperature * 0.3 : 1 + settings.temperature * 0.2;
    filters.push(`hue=s=${sat.toFixed(3)}`);
  }

  if (hasTint) {
    const rgb = hexToRgb(settings.tint);
    if (rgb) {
      const a = settings.tintOpacity;
      // Use eq brightness to simulate tint lifting
      const br = (a * (rgb.r / 255 - 0.5) * 0.12).toFixed(3);
      filters.push(`eq=brightness=${br}`);
    }
  }

  return filters.join(',') || 'null';
}

/**
 * Returns FFmpeg args as array — safe for executeWithArguments.
 */
export function buildFFmpegArgs(
  inputUri: string,
  outputUri: string,
  settings: CameraSettings
): string[] {
  const filter = buildVideoFilter(settings);
  return [
    '-i', inputUri,
    '-vf', filter,
    '-c:v', 'libx264',       // Reverted to libx264 (now supported via full-gpl)
    '-crf', '23',             // Constant Rate Factor for better quality control
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-map', '0:v:0',           // Explicit video stream mapping (stable)
    '-c:a', 'copy',           // Stream copy for audio (fast/stable)
    '-movflags', '+faststart',
    '-f', 'mp4',              // Explicitly set container format
    '-y',
    outputUri,
  ];
}
