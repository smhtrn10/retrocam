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

  // ── 5. Temperature (Color Balance) ──
  if (Math.abs(settings.temperature) > 0.05) {
    const t = settings.temperature;
    // Positive = Warm (Red up, Blue down), Negative = Cool (Blue up, Red down)
    const rGain = (1 + t * 0.12).toFixed(3);
    const bGain = (1 - t * 0.12).toFixed(3);
    filters.push(`colorchannelmixer=rr=${rGain}:bb=${bGain}`);
  }

  // ── 6. Tint (Color Overlay) ──
  if (settings.tintOpacity > 0.02) {
    const rgb = hexToRgb(settings.tint);
    if (rgb) {
      const a = settings.tintOpacity;
      // Simulate "Overlay" / "Color" blend mode via channel gains
      const rr = (1 - a + a * (rgb.r / 255)).toFixed(3);
      const gg = (1 - a + a * (rgb.g / 255)).toFixed(3);
      const bb = (1 - a + a * (rgb.b / 255)).toFixed(3);
      filters.push(`colorchannelmixer=rr=${rr}:gg=${gg}:bb=${bb}`);
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
    '-c:v', 'libx264',
    '-preset', 'ultrafast', // Crucial for mobile performance/stability
    '-crf', '23',
    '-pix_fmt', 'yuv420p',   // Ensure compatibility with all players
    '-map', '0:v',           // Map video stream
    '-map', '0:a?',          // Map audio ONLY IF it exists (prevents failure)
    '-c:a', 'aac',           // Re-encode to AAC for stability
    '-movflags', '+faststart',
    '-y',
    outputUri,
  ];
}
