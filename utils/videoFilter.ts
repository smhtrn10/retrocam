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
 * Removed risky filters: geq, curves, colorchannelmixer (not in video package)
 */
export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── 1. eq: saturation + contrast + brightness ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  const brightness = settings.fade > 0.02 ? (settings.fade * 0.08).toFixed(3) : '0';

  filters.push(
    `eq=saturation=${sat.toFixed(3)}:contrast=${contrast.toFixed(3)}:brightness=${brightness}`
  );

  // ── 2. Grain ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 20);
    filters.push(`noise=alls=${strength}:allf=t`);
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
    '-c:v', 'libx264',
    '-crf', '23',
    '-c:a', 'copy',
    '-movflags', '+faststart',
    '-y',
    outputUri,
  ];
}
