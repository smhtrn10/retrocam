import { CameraSettings } from '@/constants/presets';

/**
 * Converts CameraSettings to a valid FFmpeg -vf filter string.
 * Rules:
 * - eq: only ONE call (saturation + contrast + brightness merged)
 * - curves: only ONE call (temperature + halation + lightLeak merged per channel)
 * - other filters: one call each
 */
export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── 1. eq: saturation + contrast + brightness (single call) ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  const brightness = settings.fade > 0.02 ? (settings.fade * 0.08).toFixed(3) : '0';
  filters.push(`eq=saturation=${sat.toFixed(3)}:contrast=${contrast.toFixed(3)}:brightness=${brightness}`);

  // ── 2. curves: merge temperature + halation + lightLeak into ONE call ──
  // Each channel (r, g, b) gets a single curve with all adjustments combined
  const t = settings.temperature;
  const h = settings.halation > 0.05 ? Math.min(0.35, settings.halation * 0.35) : 0;
  const lk = settings.lightLeak > 0.05 ? Math.min(0.35, settings.lightLeak * 0.28) : 0;

  // Red channel: warm temp boosts red, halation boosts highlights, lightLeak boosts shadows
  let rMid = 0.5;
  if (t > 0.05) rMid = Math.min(0.95, 0.5 + t * 0.15);
  if (t < -0.05) rMid = Math.max(0.05, 0.5 - Math.abs(t) * 0.15);
  // halation: boost midtones on red (not highlights, to stay in 0-1 range)
  if (h > 0) rMid = Math.min(0.95, rMid + h * 0.3);
  if (lk > 0) rMid = Math.min(0.95, rMid + lk * 0.5);

  // Blue channel: cool temp boosts blue, warm reduces blue
  let bMid = 0.5;
  if (t > 0.05) bMid = Math.max(0.05, 0.5 - t * 0.15);
  if (t < -0.05) bMid = Math.min(0.95, 0.5 + Math.abs(t) * 0.15);

  // Green channel: lightLeak adds slight warmth
  let gMid = 0.5;
  if (lk > 0) gMid = Math.min(0.95, 0.5 + lk * 0.25);

  const needsCurves = Math.abs(rMid - 0.5) > 0.01 || Math.abs(bMid - 0.5) > 0.01 ||
    Math.abs(gMid - 0.5) > 0.01;

  if (needsCurves) {
    const rCurve = `0/0 0.5/${rMid.toFixed(3)} 1/1`;
    const gCurve = `0/0 0.5/${gMid.toFixed(3)} 1/1`;
    const bCurve = `0/0 0.5/${bMid.toFixed(3)} 1/1`;
    filters.push(`curves=r='${rCurve}':g='${gCurve}':b='${bCurve}'`);
  }

  // ── 3. Grain (film noise) ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 20);
    filters.push(`noise=alls=${strength}:allf=t+u`);
  }

  // ── 4. Blur (soft focus) ──
  if (settings.blur > 0.05) {
    const sigma = Math.max(0.1, settings.blur * 2.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── 5. Vignette ──
  if (settings.vignette > 0.05) {
    const angle = Math.min(1.5, settings.vignette * 1.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:mode=backward`);
  }

  // ── 6. Tint color overlay via colorchannelmixer ──
  if (settings.tintOpacity > 0.03) {
    const hex = settings.tint.replace('#', '').padEnd(6, '0');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const op = Math.min(0.4, settings.tintOpacity);
    filters.push(
      `colorchannelmixer=` +
      `rr=${(1 - op + op * r).toFixed(3)}:rg=${(op * g).toFixed(3)}:rb=${(op * b).toFixed(3)}:` +
      `gr=${(op * r).toFixed(3)}:gg=${(1 - op + op * g).toFixed(3)}:gb=${(op * b).toFixed(3)}:` +
      `br=${(op * r).toFixed(3)}:bg=${(op * g).toFixed(3)}:bb=${(1 - op + op * b).toFixed(3)}`
    );
  }

  // ── 7. RGB Shift — use geq (general equation filter, always available) ──
  // geq applies per-pixel color equations, simulates chromatic aberration
  if (settings.rgbShift > 0.03) {
    const px = Math.round(settings.rgbShift * 5);
    // Shift red channel right, blue channel left using geq
    filters.push(
      `geq=r='r(X-${px}\\,Y)':g='g(X\\,Y)':b='b(X+${px}\\,Y)'`
    );
  }

  return filters.join(',') || 'null';
}

/**
 * Builds the full FFmpeg command.
 */
export function buildFFmpegCommand(
  inputUri: string,
  outputUri: string,
  settings: CameraSettings
): string {
  const filter = buildVideoFilter(settings);
  return [
    `-i "${inputUri}"`,
    `-vf "${filter}"`,
    `-c:v libx264`,
    `-crf 23`,
    `-c:a copy`,
    `-movflags +faststart`,
    `-y`,
    `"${outputUri}"`,
  ].join(' ');
}
