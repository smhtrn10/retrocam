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

  // ── 5. Color Correction (Temperature + Tint) ──
  // Combined into one colorchannelmixer to avoid filter chain breaks (KRİTİK #2)
  const hasTemp = Math.abs(settings.temperature) > 0.05;
  const hasTint = settings.tintOpacity > 0.02;

  if (hasTemp || hasTint) {
    const t = hasTemp ? settings.temperature : 0;
    const a = hasTint ? settings.tintOpacity : 0;
    const rgb = hasTint ? hexToRgb(settings.tint) : { r: 255, g: 255, b: 255 };

    if (rgb) {
      // Temperature: Positive = Warm (Red up, Blue down), Negative = Cool (Blue up, Red down)
      const tempR = 1 + t * 0.12;
      const tempB = 1 - t * 0.12;
      
      // Tint overlay logic
      const tintR = 1 - a + a * (rgb.r / 255);
      const tintG = 1 - a + a * (rgb.g / 255);
      const tintB = 1 - a + a * (rgb.b / 255);

      // Merge both transforms
      const rr = (tempR * tintR).toFixed(3);
      const gg = (tintG).toFixed(3);
      const bb = (tempB * tintB).toFixed(3);

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
    '-c:v', 'mpeg4',         // Switch to mpeg4 for universal package compatibility (KRİTİK #1)
    '-q:v', '5',              // High quality for mpeg4 (CRF doesn't apply to native mpeg4)
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-map', '0:v',
    '-map', '0:a?',           // Map audio ONLY IF it exists
    '-c:a', 'copy',           // Try stream copy first for speed/stability (İYİLEŞTİRME #8)
    '-movflags', '+faststart',
    '-y',
    outputUri,
  ];
}
