import { CameraSettings } from '@/constants/presets';

/**
 * Converts CameraSettings to an FFmpeg video filter string.
 * Applied after recording via ffmpeg-kit-react-native.
 */
export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── Saturation (eq filter) ──
  // settings.saturation: 0=B&W, 1=normal, 2=vivid → FFmpeg saturation: 0=B&W, 1=normal
  const sat = Math.max(0, settings.saturation);
  filters.push(`eq=saturation=${sat.toFixed(2)}`);

  // ── Contrast ──
  // settings.contrast: 0.5–2, FFmpeg contrast: -1000–1000 (1=normal)
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  filters.push(`eq=contrast=${contrast.toFixed(2)}`);

  // ── Temperature (color balance) ──
  // Warm = boost red/reduce blue, Cool = boost blue/reduce red
  if (Math.abs(settings.temperature) > 0.05) {
    const t = settings.temperature;
    const rs = (1 + t * 0.3).toFixed(3);
    const bs = (1 - t * 0.3).toFixed(3);
    filters.push(`colorbalance=rs=${rs}:bs=${bs}`);
  }

  // ── Fade (lift blacks) ──
  if (settings.fade > 0.02) {
    const lift = (settings.fade * 0.15).toFixed(3);
    filters.push(`curves=r='0/${lift} 1/1':g='0/${lift} 1/1':b='0/${lift} 1/1'`);
  }

  // ── Grain (noise) ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 25);
    filters.push(`noise=alls=${strength}:allf=t+u`);
  }

  // ── Blur (soft focus) ──
  if (settings.blur > 0.05) {
    const sigma = (settings.blur * 3).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── Vignette ──
  if (settings.vignette > 0.05) {
    const angle = (settings.vignette * 1.2).toFixed(2);
    filters.push(`vignette=angle=${angle}`);
  }

  // ── Tint color overlay ──
  if (settings.tintOpacity > 0.03) {
    // Parse hex color to r,g,b
    const hex = settings.tint.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const op = settings.tintOpacity;
    // Blend tint over image
    filters.push(
      `colorchannelmixer=` +
      `rr=${(1 - op + op * r).toFixed(3)}:rg=${(op * g).toFixed(3)}:rb=${(op * b).toFixed(3)}:` +
      `gr=${(op * r).toFixed(3)}:gg=${(1 - op + op * g).toFixed(3)}:gb=${(op * b).toFixed(3)}:` +
      `br=${(op * r).toFixed(3)}:bg=${(op * g).toFixed(3)}:bb=${(1 - op + op * b).toFixed(3)}`
    );
  }

  // ── RGB Shift (chromatic aberration) ──
  if (settings.rgbShift > 0.03) {
    const px = Math.round(settings.rgbShift * 8);
    filters.push(`rgbashift=rh=${px}:bh=-${px}`);
  }

  // ── Halation (red glow on highlights) ──
  if (settings.halation > 0.05) {
    const strength = (settings.halation * 0.4).toFixed(2);
    filters.push(`colorbalance=rh=${strength}`);
  }

  // Merge eq filters (FFmpeg requires single eq call)
  const eqFilters = filters.filter(f => f.startsWith('eq='));
  const otherFilters = filters.filter(f => !f.startsWith('eq='));

  if (eqFilters.length > 1) {
    // Merge all eq params into one
    const eqParams = eqFilters.map(f => f.replace('eq=', '')).join(':');
    return [`eq=${eqParams}`, ...otherFilters].join(',');
  }

  return filters.join(',') || 'null';
}

/**
 * Builds the full FFmpeg command to apply filters to a video.
 */
export function buildFFmpegCommand(inputUri: string, outputUri: string, settings: CameraSettings): string {
  const filter = buildVideoFilter(settings);
  // -vf applies video filters, -c:a copy keeps audio untouched, -preset fast for speed
  return `-i "${inputUri}" -vf "${filter}" -c:a copy -preset fast -y "${outputUri}"`;
}
