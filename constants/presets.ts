// ─────────────────────────────────────────────────────────────
//  RetroCam AI — Camera + Film Simulation Preset Engine
// ─────────────────────────────────────────────────────────────

export type CameraType =
  | '35mm'        // 135 format film cameras
  | '120'         // Medium format
  | 'disposable'  // Single-use plastic cameras
  | 'instant'     // Polaroid / instant film
  | 'half-frame'  // Half-frame 35mm (two shots per frame)
  | 'digital-y2k' // Early 2000s digital cameras
  | '8mm'         // 8mm cine film
  | '16mm'        // 16mm cine film
  | 'camcorder'   // VHS / Hi8 / MiniDV camcorders
  | 'vhs'         // VHS tape
  | 'special';    // Special / artistic effects

export type FrameType =
  | 'none'
  | 'polaroid'    // White instant-film border
  | 'half-frame'  // Two-panel split
  | '8mm'         // Sprocket holes + film strip
  | '16mm'        // Wider film strip
  | 'camcorder'   // HUD overlay (REC, date, battery)
  | 'fisheye'     // Circular crop with black corners
  | 'disposable'  // Slight rounded corners + flash burn
  | 'digital'     // Digital camera UI chrome
  | 'vhs';        // VHS scanlines + tracking noise

export interface CameraSettings {
  grain: number;        // 0–1
  temperature: number;  // -1 cool → 1 warm
  vignette: number;     // 0–1
  blur: number;         // 0–1
  contrast: number;     // 0.5–2
  saturation: number;   // 0–2
  lightLeak: number;    // 0–1
  dust: number;         // 0–1
  timestamp: boolean;
  fade: number;         // 0–1 (lifts blacks)
  tint: string;         // hex
  tintOpacity: number;  // 0–1
  flash: number;        // 0–1 (overexposed flash burn)
  halation: number;     // 0–1 (red glow around highlights)
  rgbShift: number;     // 0–1 (chromatic aberration)
  flashColor?: string;  // hex color for flash gel (e.g. red, blue, green)
  prism?: number;       // 0–1 strength for prism/reflection lens
  retroDate?: string;   // custom retro date string e.g. "98 10 24"
  sCurve?: number;      // 0–1 non-linear film S-curve contrast response
  shadowTint?: string;  // hex analog shadow base tint (e.g. #0A1C16 for Fuji, #221808 for Kodak)
  shadowTintOpacity?: number; // 0–1
  highlightWarmth?: number;   // -1 to 1 selective highlight roll-off warmth
  dyeCrosstalk?: number;      // 0–1 inter-dye layer crosstalk
}

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  color: string;
  isPro: boolean;
  cameraType: CameraType;
  frameType: FrameType;
  filmStock?: string;   // e.g. "Kodak Gold 200", "Fuji Superia 400"
  pack?: 'japan' | 'vhs' | 'film' | 'digital' | 'cine';
  settings: CameraSettings;
}

export const CAMERA_PRESETS: CameraPreset[] = [

  // ════════════════════════════════════════════════════════
  //  FREE CAMERAS (5) — one per major type
  // ════════════════════════════════════════════════════════
  {
    id: 'kodak-gold-200',
    name: 'Kodak Gold 200',
    description: '35mm · Warm, punchy, everyday film',
    color: '#F5C842',
    isPro: false,
    cameraType: '35mm',
    frameType: 'none',
    filmStock: 'Kodak Gold 200',
    settings: { grain: 0.22, temperature: 0.28, vignette: 0.14, blur: 0, contrast: 1.08, saturation: 1.06, lightLeak: 0, dust: 0, timestamp: false, fade: 0.08, tint: '#F5C842', tintOpacity: 0.06, flash: 0, halation: 0.06, rgbShift: 0, sCurve: 0.45, shadowTint: '#241708', shadowTintOpacity: 0.1, dyeCrosstalk: 0.06 },
  },
  {
    id: 'disposable-flash',
    name: 'Disposable',
    description: 'Disposable · Plastic lens, harsh flash',
    color: '#FFE4B5',
    isPro: false,
    cameraType: 'disposable',
    frameType: 'disposable',
    filmStock: 'Generic ISO 800',
    settings: { grain: 0.34, temperature: 0.2, vignette: 0.16, blur: 0.02, contrast: 1.12, saturation: 0.94, lightLeak: 0.1, dust: 0.08, timestamp: true, fade: 0.1, tint: '#FFE4B5', tintOpacity: 0.08, flash: 0.45, halation: 0.04, rgbShift: 0.02, sCurve: 0.4, shadowTint: '#1D1409', shadowTintOpacity: 0.08, dyeCrosstalk: 0.05 },
  },
  {
    id: 'polaroid-600',
    name: 'Polaroid 600',
    description: 'Instant · Warm fade, white border',
    color: '#F4E4C1',
    isPro: false,
    cameraType: 'instant',
    frameType: 'polaroid',
    filmStock: 'Polaroid 600',
    settings: { grain: 0.24, temperature: 0.22, vignette: 0.16, blur: 0.02, contrast: 0.94, saturation: 0.88, lightLeak: 0.08, dust: 0.04, timestamp: true, fade: 0.14, tint: '#F4E4C1', tintOpacity: 0.1, flash: 0.12, halation: 0.05, rgbShift: 0, sCurve: 0.35, shadowTint: '#1B1712', shadowTintOpacity: 0.1, dyeCrosstalk: 0.06 },
  },
  {
    id: 'vhs-classic',
    name: 'VHS Classic',
    description: 'VHS · Tape noise, tracking lines',
    color: '#556B82',
    isPro: true,
    cameraType: 'vhs',
    frameType: 'vhs',
    settings: { grain: 0.32, temperature: -0.02, vignette: 0.22, blur: 0.02, contrast: 1.08, saturation: 1.04, lightLeak: 0, dust: 0.04, timestamp: true, fade: 0.06, tint: '#556B82', tintOpacity: 0.04, flash: 0, halation: 0, rgbShift: 0.03, sCurve: 0.3, shadowTint: '#101418', shadowTintOpacity: 0.08, dyeCrosstalk: 0.05 },
  },
  {
    id: 'y2k-digital',
    name: 'Y2K Digital',
    description: 'Digital 2000s · Overexposed, blown highlights',
    color: '#E0F0FF',
    isPro: true,
    cameraType: 'digital-y2k',
    frameType: 'digital',
    settings: { grain: 0.12, temperature: 0.06, vignette: 0.04, blur: 0, contrast: 1.16, saturation: 1.12, lightLeak: 0, dust: 0, timestamp: true, fade: 0.03, tint: '#E0F0FF', tintOpacity: 0.06, flash: 0.32, halation: 0, rgbShift: 0.02, sCurve: 0.25, shadowTint: '#0C1824', shadowTintOpacity: 0.08, dyeCrosstalk: 0.03 },
  },

  // ════════════════════════════════════════════════════════
  //  35mm FILM CAMERAS — Film Pack
  // ════════════════════════════════════════════════════════
  {
    id: 'fuji-superia-400',
    name: 'Fuji Superia 400',
    description: '35mm · Cool greens, natural skin tones',
    color: '#90EE90',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Fuji Superia 400',
    settings: { grain: 0.2, temperature: -0.1, vignette: 0.12, blur: 0, contrast: 1.04, saturation: 0.96, lightLeak: 0, dust: 0, timestamp: false, fade: 0.08, tint: '#90EE90', tintOpacity: 0.06, flash: 0, halation: 0.04, rgbShift: 0, sCurve: 0.38, shadowTint: '#0C1F17', shadowTintOpacity: 0.1 },
  },
  {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    description: '35mm · Creamy skin, pastel shadows',
    color: '#E8C9A0',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak Portra 400',
    settings: { grain: 0.16, temperature: 0.18, vignette: 0.1, blur: 0, contrast: 0.96, saturation: 0.92, lightLeak: 0, dust: 0, timestamp: false, fade: 0.1, tint: '#E8C9A0', tintOpacity: 0.07, flash: 0, halation: 0.08, rgbShift: 0, sCurve: 0.42, shadowTint: '#1F1710', shadowTintOpacity: 0.08 },
  },
  {
    id: 'kodak-ultramax-400',
    name: 'Kodak UltraMax',
    description: '35mm · Vivid colors, high contrast',
    color: '#FF8C42',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak UltraMax 400',
    settings: { grain: 0.24, temperature: 0.24, vignette: 0.14, blur: 0, contrast: 1.12, saturation: 1.12, lightLeak: 0, dust: 0, timestamp: false, fade: 0.06, tint: '#FF8C42', tintOpacity: 0.06, flash: 0, halation: 0.06, rgbShift: 0, sCurve: 0.4 },
  },
  {
    id: 'ilford-hp5',
    name: 'Ilford HP5',
    description: '35mm B&W · Punchy, deep blacks',
    color: '#1A1A1A',
    isPro: false, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Ilford HP5 Plus 400',
    settings: { grain: 0.36, temperature: 0, vignette: 0.18, blur: 0, contrast: 1.24, saturation: 0, lightLeak: 0, dust: 0.04, timestamp: false, fade: 0.04, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0, sCurve: 0.45 },
  },
  {
    id: 'cinestill-800t',
    name: 'CineStill 800T',
    description: '35mm · Tungsten halation, red glow',
    color: '#FF4500',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'CineStill 800T',
    settings: { grain: 0.3, temperature: -0.16, vignette: 0.22, blur: 0, contrast: 1.1, saturation: 0.96, lightLeak: 0, dust: 0, timestamp: false, fade: 0.06, tint: '#FF4500', tintOpacity: 0.06, flash: 0, halation: 0.35, rgbShift: 0.02, sCurve: 0.4, shadowTint: '#0B1820', shadowTintOpacity: 0.1 },
  },
  {
    id: 'agfa-vista-200',
    name: 'Agfa Vista 200',
    description: '35mm · Warm reds, slight fade',
    color: '#C0392B',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Agfa Vista 200',
    settings: { grain: 0.2, temperature: 0.2, vignette: 0.14, blur: 0, contrast: 1.06, saturation: 1.08, lightLeak: 0, dust: 0, timestamp: false, fade: 0.09, tint: '#C0392B', tintOpacity: 0.06, flash: 0, halation: 0.06, rgbShift: 0 },
  },
  {
    id: 'lomography-400',
    name: 'Lomography 400',
    description: '35mm · Heavy vignette, cross-processed',
    color: '#FF6347',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Lomography Color 400',
    settings: { grain: 0.34, temperature: 0.15, vignette: 0.32, blur: 0.01, contrast: 1.16, saturation: 1.14, lightLeak: 0.08, dust: 0.06, timestamp: false, fade: 0.05, tint: '#FF6347', tintOpacity: 0.06, flash: 0, halation: 0.08, rgbShift: 0.02 },
  },
  {
    id: 'slide-velvia',
    name: 'Fuji Velvia 50',
    description: '35mm Slide · Hyper-saturated, punchy',
    color: '#FF4500',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Fuji Velvia 50',
    settings: { grain: 0.12, temperature: 0.08, vignette: 0.12, blur: 0, contrast: 1.16, saturation: 1.2, lightLeak: 0, dust: 0, timestamp: false, fade: 0, tint: '#FF4500', tintOpacity: 0.04, flash: 0, halation: 0.04, rgbShift: 0, sCurve: 0.45 },
  },
  {
    id: 'redscale',
    name: 'Redscale',
    description: '35mm · Film shot backwards, red-orange',
    color: '#CC2200',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.32, temperature: 0.38, vignette: 0.2, blur: 0.01, contrast: 1.08, saturation: 1.12, lightLeak: 0.1, dust: 0.06, timestamp: false, fade: 0.08, tint: '#CC2200', tintOpacity: 0.12, flash: 0, halation: 0.1, rgbShift: 0 },
  },
  {
    id: 'cross-process',
    name: 'Cross Process',
    description: '35mm · E6 in C41, wild color shift',
    color: '#00CED1',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.28, temperature: -0.08, vignette: 0.18, blur: 0, contrast: 1.16, saturation: 1.16, lightLeak: 0.06, dust: 0.04, timestamp: false, fade: 0.05, tint: '#00CED1', tintOpacity: 0.06, flash: 0, halation: 0.06, rgbShift: 0.02 },
  },

  // ════════════════════════════════════════════════════════
  //  120 MEDIUM FORMAT
  // ════════════════════════════════════════════════════════
  {
    id: 'hasselblad-portra',
    name: 'Hasselblad 500',
    description: '120 · Soft tones, medium format depth',
    color: '#D4B896',
    isPro: true, pack: 'film', cameraType: '120', frameType: 'none', filmStock: 'Kodak Portra 160',
    settings: { grain: 0.12, temperature: 0.14, vignette: 0.08, blur: 0, contrast: 0.95, saturation: 0.9, lightLeak: 0, dust: 0, timestamp: false, fade: 0.12, tint: '#D4B896', tintOpacity: 0.06, flash: 0, halation: 0.06, rgbShift: 0, sCurve: 0.38 },
  },
  {
    id: 'mamiya-rb67',
    name: 'Mamiya RB67',
    description: '120 · Rich shadows, professional grade',
    color: '#8B6914',
    isPro: true, pack: 'film', cameraType: '120', frameType: 'none', filmStock: 'Kodak Ektar 100',
    settings: { grain: 0.1, temperature: 0.14, vignette: 0.1, blur: 0, contrast: 1.08, saturation: 1.1, lightLeak: 0, dust: 0, timestamp: false, fade: 0.06, tint: '#8B6914', tintOpacity: 0.05, flash: 0, halation: 0.06, rgbShift: 0, sCurve: 0.42 },
  },
  {
    id: 'rolleiflex-bw',
    name: 'Rolleiflex B&W',
    description: '120 B&W · Timeless, razor sharp',
    color: '#3A3A3A',
    isPro: true, pack: 'film', cameraType: '120', frameType: 'none', filmStock: 'Ilford Delta 100',
    settings: { grain: 0.18, temperature: 0, vignette: 0.14, blur: 0, contrast: 1.18, saturation: 0, lightLeak: 0, dust: 0, timestamp: false, fade: 0.05, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0, sCurve: 0.4 },
  },

  // ════════════════════════════════════════════════════════
  //  DISPOSABLE CAMERAS
  // ════════════════════════════════════════════════════════
  {
    id: 'fuji-quicksnap',
    name: 'Fuji QuickSnap',
    description: 'Disposable · Cool tones, sharp flash',
    color: '#7EC8E3',
    isPro: false, pack: 'film', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Fuji 400',
    settings: { grain: 0.34, temperature: -0.08, vignette: 0.12, blur: 0.02, contrast: 1.12, saturation: 0.95, lightLeak: 0.08, dust: 0.06, timestamp: true, fade: 0.08, tint: '#7EC8E3', tintOpacity: 0.06, flash: 0.4, halation: 0.04, rgbShift: 0.02, shadowTint: '#0D1E19', shadowTintOpacity: 0.08 },
  },
  {
    id: 'kodak-funsaver',
    name: 'Kodak FunSaver',
    description: 'Disposable · Warm, yellow cast, party vibes',
    color: '#FFD580',
    isPro: true, pack: 'film', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Kodak 800',
    settings: { grain: 0.36, temperature: 0.28, vignette: 0.12, blur: 0.02, contrast: 1.08, saturation: 0.94, lightLeak: 0.12, dust: 0.08, timestamp: true, fade: 0.1, tint: '#FFD580', tintOpacity: 0.08, flash: 0.45, halation: 0.05, rgbShift: 0.02 },
  },

  // ════════════════════════════════════════════════════════
  //  INSTANT / POLAROID
  // ════════════════════════════════════════════════════════
  {
    id: 'polaroid-sx70',
    name: 'Polaroid SX-70',
    description: 'Instant · Warm fade, dreamy soft',
    color: '#F4E4C1',
    isPro: true, pack: 'film', cameraType: 'instant', frameType: 'polaroid', filmStock: 'Polaroid SX-70',
    settings: { grain: 0.24, temperature: 0.22, vignette: 0.16, blur: 0.03, contrast: 0.92, saturation: 0.86, lightLeak: 0.1, dust: 0.05, timestamp: true, fade: 0.14, tint: '#F4E4C1', tintOpacity: 0.1, flash: 0.1, halation: 0.06, rgbShift: 0 },
  },
  {
    id: 'instax-mini',
    name: 'Instax Mini',
    description: 'Instant · Bright, slightly overexposed',
    color: '#FFF0F5',
    isPro: true, pack: 'film', cameraType: 'instant', frameType: 'polaroid', filmStock: 'Fuji Instax Mini',
    settings: { grain: 0.18, temperature: 0.1, vignette: 0.1, blur: 0.01, contrast: 0.98, saturation: 0.95, lightLeak: 0.06, dust: 0.02, timestamp: true, fade: 0.1, tint: '#FFF0F5', tintOpacity: 0.08, flash: 0.18, halation: 0.04, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  HALF-FRAME
  // ════════════════════════════════════════════════════════
  {
    id: 'olympus-pen',
    name: 'Olympus PEN',
    description: 'Half-frame · Two shots, portrait pairs',
    color: '#C8A882',
    isPro: false, pack: 'film', cameraType: 'half-frame', frameType: 'half-frame', filmStock: 'Kodak Gold 200',
    settings: { grain: 0.26, temperature: 0.18, vignette: 0.18, blur: 0.01, contrast: 1.04, saturation: 0.95, lightLeak: 0.06, dust: 0.05, timestamp: false, fade: 0.09, tint: '#C8A882', tintOpacity: 0.07, flash: 0, halation: 0.05, rgbShift: 0 },
  },
  {
    id: 'canon-demi',
    name: 'Canon Demi',
    description: 'Half-frame · Soft, vintage Japanese',
    color: '#B8A090',
    isPro: true, pack: 'film', cameraType: 'half-frame', frameType: 'half-frame', filmStock: 'Fuji 200',
    settings: { grain: 0.24, temperature: 0.12, vignette: 0.16, blur: 0.02, contrast: 0.98, saturation: 0.9, lightLeak: 0.05, dust: 0.04, timestamp: false, fade: 0.1, tint: '#B8A090', tintOpacity: 0.06, flash: 0, halation: 0.04, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  DIGITAL Y2K
  // ════════════════════════════════════════════════════════
  {
    id: 'sony-cybershot',
    name: 'Sony Cybershot',
    description: 'Digital 2003 · Blown highlights, sharp',
    color: '#C8E6FF',
    isPro: false, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital', filmStock: '3.2MP CCD',
    settings: { grain: 0.12, temperature: 0.04, vignette: 0.04, blur: 0, contrast: 1.16, saturation: 1.12, lightLeak: 0, dust: 0, timestamp: true, fade: 0.03, tint: '#C8E6FF', tintOpacity: 0.05, flash: 0.32, halation: 0, rgbShift: 0.02 },
  },
  {
    id: 'canon-ixus',
    name: 'Canon IXUS',
    description: 'Digital 2005 · Warm, slightly soft',
    color: '#FFE0B2',
    isPro: true, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital', filmStock: '5MP CCD',
    settings: { grain: 0.1, temperature: 0.16, vignette: 0.05, blur: 0, contrast: 1.12, saturation: 1.08, lightLeak: 0, dust: 0, timestamp: true, fade: 0.04, tint: '#FFE0B2', tintOpacity: 0.06, flash: 0.28, halation: 0, rgbShift: 0.01 },
  },
  {
    id: 'nokia-cam',
    name: 'Nokia 3310',
    description: 'Phone 2002 · Grainy, low-res nostalgia',
    color: '#8899AA',
    isPro: true, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital',
    settings: { grain: 0.34, temperature: 0, vignette: 0.16, blur: 0.03, contrast: 1.08, saturation: 0.85, lightLeak: 0, dust: 0, timestamp: true, fade: 0.08, tint: '#8899AA', tintOpacity: 0.06, flash: 0, halation: 0, rgbShift: 0.02 },
  },

  // ════════════════════════════════════════════════════════
  //  8mm CINE FILM — Cine Pack
  // ════════════════════════════════════════════════════════
  {
    id: 'super8-kodachrome',
    name: 'Super 8 Kodachrome',
    description: '8mm · Warm, saturated home movies',
    color: '#DAA520',
    isPro: false, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Kodachrome 40',
    settings: { grain: 0.38, temperature: 0.28, vignette: 0.24, blur: 0.03, contrast: 1.05, saturation: 1.05, lightLeak: 0.1, dust: 0.15, timestamp: true, fade: 0.12, tint: '#DAA520', tintOpacity: 0.06, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'super8-bw',
    name: 'Super 8 B&W',
    description: '8mm B&W · Gritty, raw, cinematic',
    color: '#555555',
    isPro: true, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Tri-X 200',
    settings: { grain: 0.42, temperature: 0, vignette: 0.28, blur: 0.03, contrast: 1.2, saturation: 0, lightLeak: 0.08, dust: 0.18, timestamp: false, fade: 0.06, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'regular8-faded',
    name: 'Regular 8 Faded',
    description: '8mm · Heavily faded, 1960s family film',
    color: '#C8A878',
    isPro: true, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Ektachrome 64',
    settings: { grain: 0.4, temperature: 0.22, vignette: 0.25, blur: 0.03, contrast: 0.95, saturation: 0.82, lightLeak: 0.12, dust: 0.2, timestamp: false, fade: 0.18, tint: '#C8A878', tintOpacity: 0.08, flash: 0, halation: 0.06, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  16mm CINE FILM — Cine Pack
  // ════════════════════════════════════════════════════════
  {
    id: '16mm-cinema',
    name: '16mm Cinema',
    description: '16mm · Professional indie film look',
    color: '#8B7355',
    isPro: true, pack: 'cine', cameraType: '16mm', frameType: '16mm', filmStock: 'Kodak Vision3 500T',
    settings: { grain: 0.38, temperature: -0.1, vignette: 0.24, blur: 0.05, contrast: 1.12, saturation: 0.85, lightLeak: 0.12, dust: 0.18, timestamp: false, fade: 0.1, tint: '#8B7355', tintOpacity: 0.08, flash: 0, halation: 0.15, rgbShift: 0.03 },
  },
  {
    id: '16mm-nouvelle-vague',
    name: 'Nouvelle Vague',
    description: '16mm B&W · French New Wave, 1960s',
    color: '#2A2A2A',
    isPro: true, pack: 'cine', cameraType: '16mm', frameType: '16mm', filmStock: 'Kodak Double-X',
    settings: { grain: 0.42, temperature: 0, vignette: 0.3, blur: 0.04, contrast: 1.28, saturation: 0, lightLeak: 0.06, dust: 0.2, timestamp: false, fade: 0.06, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  CAMCORDER / VHS — VHS Pack
  // ════════════════════════════════════════════════════════
  {
    id: 'handycam-dcr',
    name: 'Sony Handycam DCR',
    description: 'Camcorder · 2000s Hi8, REC overlay',
    color: '#4A4A8A',
    isPro: true, pack: 'vhs', cameraType: 'camcorder', frameType: 'camcorder',
    settings: { grain: 0.28, temperature: 0.02, vignette: 0.2, blur: 0.02, contrast: 1.08, saturation: 1.04, lightLeak: 0.05, dust: 0.06, timestamp: true, fade: 0.06, tint: '#4A4A8A', tintOpacity: 0.04, flash: 0, halation: 0, rgbShift: 0.03 },
  },
  {
    id: 'vhs-glitch',
    name: 'VHS Glitch',
    description: 'VHS · Corrupted tape, RGB chaos',
    color: '#4A7A8C',
    isPro: false, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.35, temperature: -0.04, vignette: 0.22, blur: 0.03, contrast: 1.1, saturation: 1.08, lightLeak: 0.06, dust: 0.08, timestamp: true, fade: 0.06, tint: '#4A7A8C', tintOpacity: 0.04, flash: 0, halation: 0, rgbShift: 0.04, sCurve: 0.32, shadowTint: '#121C18', shadowTintOpacity: 0.1 },
  },
  {
    id: 'vhs-lo-fi',
    name: 'VHS Lo-Fi',
    description: 'VHS · Washed out, soft tracking',
    color: '#8B7355',
    isPro: true, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.32, temperature: 0.08, vignette: 0.2, blur: 0.03, contrast: 1.02, saturation: 0.92, lightLeak: 0.06, dust: 0.12, timestamp: true, fade: 0.14, tint: '#8B7355', tintOpacity: 0.06, flash: 0, halation: 0, rgbShift: 0.03 },
  },
  {
    id: 'vhs-neon',
    name: 'VHS Neon',
    description: 'VHS · 80s video store, neon-soaked',
    color: '#8A55A0',
    isPro: true, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.32, temperature: -0.05, vignette: 0.24, blur: 0.03, contrast: 1.15, saturation: 1.18, lightLeak: 0.08, dust: 0.08, timestamp: true, fade: 0.06, tint: '#8A55A0', tintOpacity: 0.05, flash: 0, halation: 0, rgbShift: 0.04 },
  },

  // ════════════════════════════════════════════════════════
  //  SPECIAL / ARTISTIC — Japan Pack + Standalone
  // ════════════════════════════════════════════════════════
  {
    id: 'fisheye-lomo',
    name: 'Fisheye Lomo',
    description: 'Special · Barrel distortion, wide angle',
    color: '#FF6347',
    isPro: true, pack: 'film', cameraType: 'special', frameType: 'fisheye',
    settings: { grain: 0.25, temperature: 0.08, vignette: 0.35, blur: 0, contrast: 1.15, saturation: 1.15, lightLeak: 0.06, dust: 0.08, timestamp: false, fade: 0.04, tint: '#FF6347', tintOpacity: 0.05, flash: 0, halation: 0.06, rgbShift: 0.02 },
  },
  {
    id: 'sepia-classic',
    name: 'Sepia Classic',
    description: 'Special · Warm brown, 1900s nostalgia',
    color: '#8B6914',
    isPro: true, cameraType: 'special', frameType: 'none',
    settings: { grain: 0.3, temperature: 0.4, vignette: 0.28, blur: 0.02, contrast: 0.98, saturation: 0.15, lightLeak: 0, dust: 0.16, timestamp: false, fade: 0.16, tint: '#8B6914', tintOpacity: 0.25, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'tokyo-1998',
    name: 'Tokyo 1998',
    description: '35mm · Cyberpunk neon, green shadows',
    color: '#00FF88',
    isPro: true, pack: 'japan', cameraType: '35mm', frameType: 'none', filmStock: 'Fuji Provia 400',
    settings: { grain: 0.22, temperature: -0.35, vignette: 0.24, blur: 0, contrast: 1.22, saturation: 1.24, lightLeak: 0.08, dust: 0, timestamp: true, fade: 0.04, tint: '#00FF88', tintOpacity: 0.06, flash: 0, halation: 0.08, rgbShift: 0.03 },
  },
  {
    id: 'osaka-dusk',
    name: 'Osaka Dusk',
    description: '35mm · Purple twilight, neon reflections',
    color: '#9B59B6',
    isPro: true, pack: 'japan', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak Portra 800',
    settings: { grain: 0.2, temperature: -0.18, vignette: 0.26, blur: 0, contrast: 1.18, saturation: 1.18, lightLeak: 0.06, dust: 0, timestamp: true, fade: 0.06, tint: '#9B59B6', tintOpacity: 0.08, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'kyoto-spring',
    name: 'Kyoto Spring',
    description: 'Instant · Cherry blossom, soft haze',
    color: '#FFB7C5',
    isPro: false, pack: 'japan', cameraType: 'instant', frameType: 'polaroid', filmStock: 'Fuji Instax',
    settings: { grain: 0.14, temperature: 0.1, vignette: 0.12, blur: 0.02, contrast: 0.94, saturation: 1.0, lightLeak: 0.06, dust: 0, timestamp: false, fade: 0.1, tint: '#FFB7C5', tintOpacity: 0.08, flash: 0.08, halation: 0.05, rgbShift: 0 },
  },
  {
    id: 'shibuya-crossing',
    name: 'Shibuya Crossing',
    description: 'Disposable · Motion blur, city lights',
    color: '#FFD700',
    isPro: true, pack: 'japan', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Kodak 800',
    settings: { grain: 0.28, temperature: 0.08, vignette: 0.22, blur: 0.02, contrast: 1.15, saturation: 1.08, lightLeak: 0.08, dust: 0.06, timestamp: true, fade: 0.05, tint: '#FFD700', tintOpacity: 0.06, flash: 0.22, halation: 0.06, rgbShift: 0.02 },
  },
  {
    id: 'noir-detective',
    name: 'Noir Detective',
    description: '35mm B&W · Hard shadows, drama',
    color: '#111111',
    isPro: true, cameraType: '35mm', frameType: 'none', filmStock: 'Kodak T-Max 400',
    settings: { grain: 0.32, temperature: 0, vignette: 0.36, blur: 0, contrast: 1.48, saturation: 0, lightLeak: 0, dust: 0.08, timestamp: false, fade: 0, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'bleach-bypass',
    name: 'Bleach Bypass',
    description: '35mm · Silver retention, desaturated grit',
    color: '#A9A9A9',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.3, temperature: 0, vignette: 0.22, blur: 0, contrast: 1.35, saturation: 0.38, lightLeak: 0, dust: 0.06, timestamp: false, fade: 0.04, tint: '#A9A9A9', tintOpacity: 0.06, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'infrared',
    name: 'Infrared',
    description: '35mm · IR film, glowing foliage',
    color: '#FF6666',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.24, temperature: 0.1, vignette: 0.16, blur: 0.02, contrast: 1.2, saturation: 0.3, lightLeak: 0.06, dust: 0, timestamp: false, fade: 0.08, tint: '#FF6666', tintOpacity: 0.12, flash: 0, halation: 0.16, rgbShift: 0 },
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    description: '35mm · Hollywood blockbuster grade',
    color: '#008080',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.14, temperature: 0.2, vignette: 0.16, blur: 0, contrast: 1.15, saturation: 1.1, lightLeak: 0, dust: 0, timestamp: false, fade: 0.04, tint: '#008080', tintOpacity: 0.08, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'classic-m',
    name: 'Classic M',
    description: 'Rangefinder · Sharp, contrasty film look',
    color: '#333333',
    isPro: false, cameraType: '35mm', frameType: 'none', filmStock: 'Leica Style',
    settings: { grain: 0.12, temperature: -0.05, vignette: 0.18, blur: 0, contrast: 1.22, saturation: 0.96, lightLeak: 0, dust: 0, timestamp: false, fade: 0.02, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0.04, rgbShift: 0 },
  },
  {
    id: 'd-classic',
    name: 'D Classic',
    description: 'Digital · 90s point-and-shoot vibe',
    color: '#C0C0C0',
    isPro: true, cameraType: 'digital-y2k', frameType: 'digital', filmStock: 'Vintage CMOS',
    settings: { grain: 0.12, temperature: 0.1, vignette: 0.1, blur: 0, contrast: 1.1, saturation: 0.88, lightLeak: 0, dust: 0, timestamp: true, fade: 0.06, tint: '#FFFFFF', tintOpacity: 0.03, flash: 0.15, halation: 0, rgbShift: 0.01 },
  },
  {
    id: 'ccd-r',
    name: 'CCD-R',
    description: 'CCD Sensor · Vivid colors, early digital',
    color: '#4169E1',
    isPro: true, cameraType: 'digital-y2k', frameType: 'digital', filmStock: 'CCD R-Sensor',
    settings: { grain: 0.06, temperature: 0.15, vignette: 0.06, blur: 0, contrast: 1.25, saturation: 1.3, lightLeak: 0, dust: 0, timestamp: true, fade: 0.03, tint: '#4169E1', tintOpacity: 0.06, flash: 0.1, halation: 0, rgbShift: 0.01 },
  },
  {
    id: 'd-exp',
    name: 'D-Exp',
    description: 'Experimental · High saturation, deep shadows',
    color: '#FF1493',
    isPro: true, cameraType: 'special', frameType: 'none',
    settings: { grain: 0.22, temperature: 0.15, vignette: 0.22, blur: 0, contrast: 1.18, saturation: 1.18, lightLeak: 0.08, dust: 0.06, timestamp: false, fade: 0.08, tint: '#FF1493', tintOpacity: 0.06, flash: 0, halation: 0.08, rgbShift: 0.02 },
  },
];

// ─── Helpers ────────────────────────────────────────────────
export const CAMERA_TYPE_LABELS: Record<CameraType, string> = {
  '35mm':        '35mm Film',
  '120':         '120 Medium',
  'disposable':  'Disposable',
  'instant':     'Instant',
  'half-frame':  'Half-Frame',
  'digital-y2k': 'Y2K Digital',
  '8mm':         '8mm Cine',
  '16mm':        '16mm Cine',
  'camcorder':   'Camcorder',
  'vhs':         'VHS',
  'special':     'Special',
};

export const CAMERA_TYPE_ICONS: Record<CameraType, string> = {
  '35mm':        '🎞',
  '120':         '📷',
  'disposable':  '📸',
  'instant':     '🟦',
  'half-frame':  '⬛',
  'digital-y2k': '💾',
  '8mm':         '🎬',
  '16mm':        '🎥',
  'camcorder':   '📹',
  'vhs':         '📼',
  'special':     '✨',
};
