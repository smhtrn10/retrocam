import { CameraSettings } from '@/constants/presets';

/**
 * Converts CameraSettings to a valid FFmpeg -vf filter string.
 * Returns filter string AND args array separately for safe execution.
 */
export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── 1. eq: saturation + contrast + brightness (single call) ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  const brightness = settings.fade > 0.02 ? (settings.fade * 0.08).toFixed(3) : '0';
  filters.push(`eq=saturation=${sat.toFixed(3)}:contrast=${contrast.toFixed(3)}:brightness=${brightness}`);

  // ── 2. curves: merge temperature + halation + lightLeak into ONE call ──
  const t = settings.temperature;
  const h = settings.halation > 0.05 ? Math.min(0.35, settings.halation * 0.35) : 0;
  const lk = settings.lightLeak > 0.05 ? Math.min(0.35, settings.lightLeak * 0.28) : 0;

  let rMid = 0.5;
  if (t > 0.05) rMid = Math.min(0.95, 0.5 + t * 0.15);
  if (t < -0.05) rMid = Math.max(0.05, 0.5 - Math.abs(t) * 0.15);
  if (h > 0) rMid = Math.min(0.95, rMid + h * 0.3);
  if (lk > 0) rMid = Math.min(0.95, rMid + lk * 0.5);

  let bMid = 0.5;
  if (t > 0.05) bMid = Math.max(0.05, 0.5 - t * 0.15);
  if (t < -0.05) bMid = Math.min(0.95, 0.5 + Math.abs(t) * 0.15);

  let gMid = 0.5;
  if (lk > 0) gMid = Math.min(0.95, 0.5 + lk * 0.25);

  const needsCurves = Math.abs(rMid - 0.5) > 0.01 || Math.abs(bMid - 0.5) > 0.01 || Math.abs(gMid - 0.5) > 0.01;
  if (needsCurves) {
    filters.push(`curves=r='0/0 0.5/${rMid.toFixed(3)} 1/1':g='0/0 0.5/${gMid.toFixed(3)} 1/1':b='0/0 0.5/${bMid.toFixed(3)} 1/1'`);
  }

  // ── 3. Grain — use allf=t (temporal, universally supported) ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 20);
    filters.push(`noise=alls=${strength}:allf=t`);
  }

  // ── 4. Blur ──
  if (settings.blur > 0.1) {
    const sigma = Math.max(0.5, settings.blur * 2.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── 5. Vignette — mode=backward is invalid, use eval=init ──
  if (settings.vignette > 0.05) {
    const angle = Math.min(1.5, settings.vignette * 1.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:eval=init`);
  }

  // ── 6. Tint via colorchannelmixer — clamp cross-channel values ──
  if (settings.tintOpacity > 0.03) {
    const hex = settings.tint.replace('#', '').padEnd(6, '0');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const op = Math.min(0.35, settings.tintOpacity); // capped to prevent oversaturation
    // Clamp all values to 0-1 range
    const clamp = (v: number) => Math.max(0, Math.min(1, v)).toFixed(3);
    filters.push(
      `colorchannelmixer=` +
      `rr=${clamp(1 - op + op * r)}:rg=${clamp(op * g)}:rb=${clamp(op * b)}:` +
      `gr=${clamp(op * r)}:gg=${clamp(1 - op + op * g)}:gb=${clamp(op * b)}:` +
      `br=${clamp(op * r)}:bg=${clamp(op * g)}:bb=${clamp(1 - op + op * b)}`
    );
  }

  // ── 7. RGB Shift — use geq without escape issues ──
  if (settings.rgbShift > 0.03) {
    const px = Math.round(settings.rgbShift * 5);
    // No backslash escaping — commas inside single quotes are safe in filter string
    filters.push(`geq=r='r(X-${px},Y)':g='g(X,Y)':b='b(X+${px},Y)'`);
  }

  return filters.join(',') || 'null';
}

/**
 * Returns FFmpeg args as an array — safe for executeAsync, handles paths with spaces.
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

/**
 * Legacy string command — kept for compatibility but prefer buildFFmpegArgs.
 */
export function buildFFmpegCommand(
  inputUri: string,
  outputUri: string,
  settings: CameraSettings
): string {
  return buildFFmpegArgs(inputUri, outputUri, settings).join(' ');
}
