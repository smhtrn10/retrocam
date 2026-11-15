import { CameraSettings } from '@/constants/presets';

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) / 255,
      g: parseInt(clean[1] + clean[1], 16) / 255,
      b: parseInt(clean[2] + clean[2], 16) / 255,
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16) / 255,
      g: parseInt(clean.slice(2, 4), 16) / 255,
      b: parseInt(clean.slice(4, 6), 16) / 255,
    };
  }
  return { r: 0.5, g: 0.5, b: 0.5 };
}

/**
 * Builds a film-characteristic ColorMatrix incorporating non-linear S-curve
 * response, highlight roll-off, analog dye crosstalk, and shadow tinting.
 */
export function buildColorMatrix(settings: CameraSettings): number[] {
  const { contrast, saturation, temperature, fade } = settings;
  const sCurve = settings.sCurve ?? 0.35;
  const shadowTint = settings.shadowTint;
  const dyeCrosstalk = settings.dyeCrosstalk ?? 0.06;
  const highlightWarmth = settings.highlightWarmth ?? 0;

  // Luminance weights (Rec. 709)
  const lumaR = 0.2126;
  const lumaG = 0.7152;
  const lumaB = 0.0722;

  const sr = (1 - saturation) * lumaR;
  const sg = (1 - saturation) * lumaG;
  const sb = (1 - saturation) * lumaB;

  // Non-linear temperature shaping protecting human skin tones & highlight warmth roll-off:
  const warmR = 1 + temperature * 0.18 + highlightWarmth * 0.05;
  const coolB = 1 - temperature * 0.18 - highlightWarmth * 0.05;

  // Film S-curve contrast response:
  // Expands midtone contrast while softening highlight clipping
  const c = contrast;
  const sCurveOffset = (1 - c) * (0.42 - sCurve * 0.05);
  const fadeOffset = fade * 0.12;

  // Inter-dye layer crosstalk (energy-conserving chemical dye dispersion)
  const crossRG = dyeCrosstalk * 0.06;
  const crossGB = dyeCrosstalk * 0.04;
  const crossBR = dyeCrosstalk * 0.03;

  // Shadow base tinting (e.g. Fuji emerald green, Kodak golden amber, Cine teal)
  let shadowR = 0;
  let shadowG = 0;
  let shadowB = 0;
  if (shadowTint) {
    const rgb = hexToRgb01(shadowTint);
    const opacity = settings.shadowTintOpacity ?? 0.08;
    shadowR = (rgb.r - 0.5) * opacity;
    shadowG = (rgb.g - 0.5) * opacity;
    shadowB = (rgb.b - 0.5) * opacity;
  }

  const rOffset = sCurveOffset + fadeOffset + shadowR;
  const gOffset = sCurveOffset + fadeOffset + shadowG;
  const bOffset = sCurveOffset + fadeOffset + shadowB;

  const diagR = sr + saturation * (1 - crossRG - crossBR);
  const diagG = sg + saturation * (1 - crossRG - crossGB);
  const diagB = sb + saturation * (1 - crossBR - crossGB);

  return [
    diagR * warmR * c,                   (sg + saturation * crossRG) * warmR * c, (sb + saturation * crossBR) * c,       0, rOffset,
    (sr + saturation * crossRG) * c,     diagG * c,                               (sb + saturation * crossGB) * c,       0, gOffset,
    (sr + saturation * crossBR) * coolB * c, (sg + saturation * crossGB) * coolB * c, diagB * coolB * c,                 0, bOffset,
    0,                                   0,                                       0,                                     1, 0,
  ];
}

export function getVignetteParams(width: number, height: number, strength: number) {
  return {
    cx: width / 2,
    cy: height / 2,
    r: Math.max(width, height) * 0.72,
    opacity: strength,
  };
}

export function applyColorMatrix(imageData: ImageData, matrix: number[]): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    data[i] = Math.min(255, Math.max(0, r * matrix[0] + g * matrix[1] + b * matrix[2] + matrix[4] * 255));
    data[i + 1] = Math.min(255, Math.max(0, r * matrix[5] + g * matrix[6] + b * matrix[7] + matrix[9] * 255));
    data[i + 2] = Math.min(255, Math.max(0, r * matrix[10] + g * matrix[11] + b * matrix[12] + matrix[14] * 255));
  }
  return imageData;
}
