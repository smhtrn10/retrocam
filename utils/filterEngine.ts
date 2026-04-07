import { CameraSettings } from '@/constants/presets';

export function buildColorMatrix(settings: CameraSettings): number[] {
  const { contrast, saturation, temperature, fade } = settings;

  const sr = (1 - saturation) * 0.2126;
  const sg = (1 - saturation) * 0.7152;
  const sb = (1 - saturation) * 0.0722;

  const tempR = 1 + temperature * 0.22;
  const tempB = 1 - temperature * 0.22;

  const c = contrast;
  const contrastOffset = (1 - c) * 0.5;
  const fadeOffset = fade * 0.15;

  return [
    (sr + saturation) * tempR * c,  sg * tempR * c,              sb * tempR * c,              0, contrastOffset + fadeOffset,
    sr * c,                          (sg + saturation) * c,       sb * c,                      0, contrastOffset + fadeOffset,
    sr * tempB * c,                  sg * tempB * c,              (sb + saturation) * tempB * c, 0, contrastOffset + fadeOffset,
    0,                               0,                           0,                           1, 0,
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
