import { CameraPreset } from '@/constants/presets';

export function isPresetLocked(preset: CameraPreset, isPro: boolean): boolean {
  return preset.isPro && !isPro;
}
