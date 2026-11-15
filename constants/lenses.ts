export type LensType = 'prime' | 'fisheye' | 'prism' | 'star' | 'wide';

export interface CameraLens {
  id: LensType;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  opticalRatio: number;
  isPro?: boolean;
}

export const CAMERA_LENSES: CameraLens[] = [
  {
    id: 'prime',
    name: '35mm Prime',
    tagline: 'Standard Glass',
    badge: '35mm',
    description: 'Clean, sharp vintage optics with natural field of view.',
    opticalRatio: 1.0,
    isPro: false,
  },
  {
    id: 'fisheye',
    name: 'Fisheye 8mm',
    tagline: '180° Circular',
    badge: 'FISH',
    description: 'Extreme ultra-wide barrel distortion with classic circular vignette.',
    opticalRatio: 0.88,
    isPro: false,
  },
  {
    id: 'prism',
    name: 'Prism Flare',
    tagline: '3-Facet Crystal',
    badge: 'PRISM',
    description: 'Triple refraction ghosting highlights across horizontal plane.',
    opticalRatio: 1.0,
    isPro: true,
  },
  {
    id: 'star',
    name: 'Star Cross',
    tagline: '4-Point Flare',
    badge: 'STAR',
    description: 'Cinematic cross-screen starbursts radiating from specular highlights.',
    opticalRatio: 1.0,
    isPro: true,
  },
  {
    id: 'wide',
    name: '28mm Street',
    tagline: 'Wide Perspective',
    badge: '28mm',
    description: 'Expansive wide angle with vintage corner light dispersion.',
    opticalRatio: 0.94,
    isPro: false,
  },
];
