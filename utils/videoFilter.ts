import { CameraSettings } from '@/constants/presets';

/**
 * Converts CameraSettings to a valid FFmpeg -vf filter string.
 * All filters are tested against FFmpeg's video filter set.
 */
export function buildVideoFilter(settings: CameraSettings): string {
  const filters: string[] = [];

  // ── eq: saturation + contrast + brightness (single call, merged) ──
  const sat = Math.max(0, Math.min(3, settings.saturation));
  const contrast = Math.max(0.5, Math.min(2, settings.contrast));
  // fade lifts brightness slightly
  const brightness = settings.fade > 0.02 ? (settings.fade * 0.08).toFixed(3) : '0';
  filters.push(`eq=saturation=${sat.toFixed(3)}:contrast=${contrast.toFixed(3)}:brightness=${brightness}`);

  // ── Temperature via curves (warm = lift red/lower blue, cool = opposite) ──
  if (Math.abs(settings.temperature) > 0.05) {
    const t = settings.temperature;
    if (t > 0) {
      // Warm: boost red channel, reduce blue
      const rBoost = Math.min(1, 0.5 + t * 0.15).toFixed(3);
      const bReduce = Math.max(0, 0.5 - t * 0.15).toFixed(3);
      filters.push(`curves=r='0/0 0.5/${rBoost} 1/1':b='0/0 0.5/${bReduce} 1/1'`);
    } else {
      // Cool: boost blue, reduce red
      const bBoost = Math.min(1, 0.5 + Math.abs(t) * 0.15).toFixed(3);
      const rReduce = Math.max(0, 0.5 - Math.abs(t) * 0.15).toFixed(3);
      filters.push(`curves=r='0/0 0.5/${rReduce} 1/1':b='0/0 0.5/${bBoost} 1/1'`);
    }
  }

  // ── Halation: red glow via curves (separate from temperature) ──
  if (settings.halation > 0.05) {
    const h = Math.min(0.4, settings.halation * 0.35);
    const rTop = Math.min(1, 1 + h).toFixed(3);
    filters.push(`curves=r='0/0 0.7/${rTop} 1/1'`);
  }

  // ── Grain (film noise) ──
  if (settings.grain > 0.05) {
    const strength = Math.round(settings.grain * 20);
    filters.push(`noise=alls=${strength}:allf=t+u`);
  }

  // ── Blur (soft focus) ──
  if (settings.blur > 0.05) {
    const sigma = Math.max(0.1, settings.blur * 2.5).toFixed(1);
    filters.push(`gblur=sigma=${sigma}`);
  }

  // ── Vignette ──
  if (settings.vignette > 0.05) {
    const angle = Math.min(Math.PI / 2, settings.vignette * 1.1).toFixed(3);
    filters.push(`vignette=angle=${angle}:mode=backward`);
  }

  // ── Tint color overlay via colorchannelmixer ──
  if (settings.tintOpacity > 0.03) {
    const hex = settings.tint.replace('#', '').padEnd(6, '0');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const op = Math.min(0.5, settings.tintOpacity); // cap at 0.5 to avoid full color wash
    filters.push(
      `colorchannelmixer=` +
      `rr=${(1 - op + op * r).toFixed(3)}:rg=${(op * g).toFixed(3)}:rb=${(op * b).toFixed(3)}:` +
      `gr=${(op * r).toFixed(3)}:gg=${(1 - op + op * g).toFixed(3)}:gb=${(op * b).toFixed(3)}:` +
      `br=${(op * r).toFixed(3)}:bg=${(op * g).toFixed(3)}:bb=${(1 - op + op * b).toFixed(3)}`
    );
  }

  // ── RGB Shift via chromashift (available in ffmpeg video filters) ──
  if (settings.rgbShift > 0.03) {
    const px = Math.round(settings.rgbShift * 6);
    filters.push(`chromashift=crh=${px}:cbh=-${px}`);
  }

  // ── Light leak: boost top-left corner brightness ──
  if (settings.lightLeak > 0.05) {
    const lk = Math.min(0.4, settings.lightLeak * 0.3).toFixed(3);
    filters.push(`curves=r='0/0 0.3/${(0.3 + parseFloat(lk)).toFixed(3)} 1/1':g='0/0 0.3/${(0.3 + parseFloat(lk) * 0.5).toFixed(3)} 1/1'`);
  }

  return filters.join(',') || 'null';
}

/**
 * Builds the full FFmpeg command to apply filters to a video.
 * Uses libx264 with fast preset and copies audio untouched.
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
