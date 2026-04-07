import { useMemo } from 'react';
import { CAMERA_PRESETS, CameraPreset } from '@/constants/presets';

// Simulated trending scores — in production these would come from an API.
// Scores rotate daily based on date so "trending" feels fresh each day.
const TRENDING_WEIGHTS: Record<string, number> = {
  'vhs-memory': 95,
  'tokyo-1998': 92,
  'disposable': 88,
  'insta-90s': 85,
  'lomography': 83,
  'cinestill-800t': 80,
  'nyc-flash': 78,
  'super8': 76,
  'cross-process': 74,
  'paris-1987': 72,
};

export function useTrending(): CameraPreset[] {
  return useMemo(() => {
    // Rotate top 5 based on day of week for freshness
    const dayOffset = new Date().getDay();
    const sorted = CAMERA_PRESETS
      .map((p) => ({
        preset: p,
        score: (TRENDING_WEIGHTS[p.id] ?? Math.floor(Math.random() * 40 + 20) + dayOffset) ,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.preset);
    return sorted;
  }, []);
}
