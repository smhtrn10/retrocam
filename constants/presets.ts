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
    settings: { grain: 0.28, temperature: 0.35, vignette: 0.14, blur: 0, contrast: 1.08, saturation: 1.05, lightLeak: 0.06, dust: 0.1, timestamp: false, fade: 0.1, tint: '#F5C842', tintOpacity: 0.07, flash: 0, halation: 0.1, rgbShift: 0 },
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
    settings: { grain: 0.5, temperature: 0.25, vignette: 0.1, blur: 0.08, contrast: 1.12, saturation: 0.88, lightLeak: 0.24, dust: 0.22, timestamp: true, fade: 0.14, tint: '#FFE4B5', tintOpacity: 0.1, flash: 0.6, halation: 0.05, rgbShift: 0.05 },
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
    settings: { grain: 0.32, temperature: 0.28, vignette: 0.18, blur: 0.1, contrast: 0.88, saturation: 0.82, lightLeak: 0.22, dust: 0.12, timestamp: true, fade: 0.2, tint: '#F4E4C1', tintOpacity: 0.12, flash: 0.15, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'vhs-classic',
    name: 'VHS Classic',
    description: 'VHS · Tape noise, tracking lines',
    color: '#FF6B9D',
    isPro: true,
    cameraType: 'vhs',
    frameType: 'vhs',
    settings: { grain: 0.52, temperature: 0.1, vignette: 0.34, blur: 0.16, contrast: 1.18, saturation: 1.22, lightLeak: 0.38, dust: 0.22, timestamp: true, fade: 0.1, tint: '#FF00FF', tintOpacity: 0.06, flash: 0, halation: 0, rgbShift: 0.15 },
  },
  {
    id: 'y2k-digital',
    name: 'Y2K Digital',
    description: 'Digital 2000s · Overexposed, blown highlights',
    color: '#E0F0FF',
    isPro: true,
    cameraType: 'digital-y2k',
    frameType: 'digital',
    settings: { grain: 0.18, temperature: 0.1, vignette: 0.04, blur: 0, contrast: 1.22, saturation: 1.18, lightLeak: 0.08, dust: 0.04, timestamp: true, fade: 0.05, tint: '#E0F0FF', tintOpacity: 0.08, flash: 0.45, halation: 0, rgbShift: 0.04 },
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
    settings: { grain: 0.24, temperature: -0.15, vignette: 0.12, blur: 0.02, contrast: 0.92, saturation: 0.88, lightLeak: 0.04, dust: 0.08, timestamp: false, fade: 0.12, tint: '#90EE90', tintOpacity: 0.08, flash: 0, halation: 0.05, rgbShift: 0 },
  },
  {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    description: '35mm · Creamy skin, pastel shadows',
    color: '#E8C9A0',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak Portra 400',
    settings: { grain: 0.2, temperature: 0.2, vignette: 0.1, blur: 0.03, contrast: 0.88, saturation: 0.82, lightLeak: 0.05, dust: 0.06, timestamp: false, fade: 0.15, tint: '#E8C9A0', tintOpacity: 0.09, flash: 0, halation: 0.12, rgbShift: 0 },
  },
  {
    id: 'kodak-ultramax-400',
    name: 'Kodak UltraMax',
    description: '35mm · Vivid colors, high contrast',
    color: '#FF8C42',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak UltraMax 400',
    settings: { grain: 0.26, temperature: 0.3, vignette: 0.16, blur: 0, contrast: 1.15, saturation: 1.12, lightLeak: 0.08, dust: 0.09, timestamp: false, fade: 0.08, tint: '#FF8C42', tintOpacity: 0.08, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'ilford-hp5',
    name: 'Ilford HP5',
    description: '35mm B&W · Punchy, deep blacks',
    color: '#1A1A1A',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Ilford HP5 Plus 400',
    settings: { grain: 0.45, temperature: 0, vignette: 0.2, blur: 0, contrast: 1.32, saturation: 0, lightLeak: 0, dust: 0.15, timestamp: false, fade: 0.05, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'cinestill-800t',
    name: 'CineStill 800T',
    description: '35mm · Tungsten halation, red glow',
    color: '#FF4500',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'CineStill 800T',
    settings: { grain: 0.4, temperature: -0.2, vignette: 0.28, blur: 0.08, contrast: 1.1, saturation: 0.9, lightLeak: 0.22, dust: 0.12, timestamp: false, fade: 0.08, tint: '#FF4500', tintOpacity: 0.1, flash: 0, halation: 0.45, rgbShift: 0.05 },
  },
  {
    id: 'agfa-vista-200',
    name: 'Agfa Vista 200',
    description: '35mm · Warm reds, slight fade',
    color: '#C0392B',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Agfa Vista 200',
    settings: { grain: 0.22, temperature: 0.25, vignette: 0.14, blur: 0, contrast: 1.05, saturation: 1.08, lightLeak: 0.06, dust: 0.08, timestamp: false, fade: 0.12, tint: '#C0392B', tintOpacity: 0.07, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'lomography-400',
    name: 'Lomography 400',
    description: '35mm · Heavy vignette, cross-processed',
    color: '#FF6347',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Lomography Color 400',
    settings: { grain: 0.5, temperature: 0.2, vignette: 0.44, blur: 0.05, contrast: 1.35, saturation: 1.4, lightLeak: 0.32, dust: 0.2, timestamp: false, fade: 0.05, tint: '#FF6347', tintOpacity: 0.1, flash: 0, halation: 0.1, rgbShift: 0.08 },
  },
  {
    id: 'slide-velvia',
    name: 'Fuji Velvia 50',
    description: '35mm Slide · Hyper-saturated, punchy',
    color: '#FF4500',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none', filmStock: 'Fuji Velvia 50',
    settings: { grain: 0.14, temperature: 0.1, vignette: 0.12, blur: 0, contrast: 1.32, saturation: 1.55, lightLeak: 0.03, dust: 0.05, timestamp: false, fade: 0, tint: '#FF4500', tintOpacity: 0.05, flash: 0, halation: 0.06, rgbShift: 0 },
  },
  {
    id: 'redscale',
    name: 'Redscale',
    description: '35mm · Film shot backwards, red-orange',
    color: '#CC2200',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.4, temperature: 0.5, vignette: 0.24, blur: 0.05, contrast: 1.1, saturation: 1.2, lightLeak: 0.16, dust: 0.15, timestamp: false, fade: 0.08, tint: '#CC2200', tintOpacity: 0.18, flash: 0, halation: 0.12, rgbShift: 0 },
  },
  {
    id: 'cross-process',
    name: 'Cross Process',
    description: '35mm · E6 in C41, wild color shift',
    color: '#00CED1',
    isPro: true, pack: 'film', cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.35, temperature: -0.1, vignette: 0.2, blur: 0.03, contrast: 1.4, saturation: 1.5, lightLeak: 0.16, dust: 0.1, timestamp: false, fade: 0.05, tint: '#00CED1', tintOpacity: 0.1, flash: 0, halation: 0.08, rgbShift: 0.1 },
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
    settings: { grain: 0.16, temperature: 0.18, vignette: 0.08, blur: 0.04, contrast: 0.85, saturation: 0.78, lightLeak: 0.03, dust: 0.06, timestamp: false, fade: 0.18, tint: '#D4B896', tintOpacity: 0.08, flash: 0, halation: 0.1, rgbShift: 0 },
  },
  {
    id: 'mamiya-rb67',
    name: 'Mamiya RB67',
    description: '120 · Rich shadows, professional grade',
    color: '#8B6914',
    isPro: true, pack: 'film', cameraType: '120', frameType: 'none', filmStock: 'Kodak Ektar 100',
    settings: { grain: 0.12, temperature: 0.15, vignette: 0.11, blur: 0.02, contrast: 1.05, saturation: 1.1, lightLeak: 0.02, dust: 0.05, timestamp: false, fade: 0.1, tint: '#8B6914', tintOpacity: 0.07, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'rolleiflex-bw',
    name: 'Rolleiflex B&W',
    description: '120 B&W · Timeless, razor sharp',
    color: '#3A3A3A',
    isPro: true, pack: 'film', cameraType: '120', frameType: 'none', filmStock: 'Ilford Delta 100',
    settings: { grain: 0.2, temperature: 0, vignette: 0.16, blur: 0, contrast: 1.2, saturation: 0, lightLeak: 0, dust: 0.1, timestamp: false, fade: 0.06, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  DISPOSABLE CAMERAS
  // ════════════════════════════════════════════════════════
  {
    id: 'fuji-quicksnap',
    name: 'Fuji QuickSnap',
    description: 'Disposable · Cool tones, sharp flash',
    color: '#7EC8E3',
    isPro: true, pack: 'film', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Fuji 400',
    settings: { grain: 0.48, temperature: -0.1, vignette: 0.08, blur: 0.06, contrast: 1.15, saturation: 0.92, lightLeak: 0.2, dust: 0.2, timestamp: true, fade: 0.12, tint: '#7EC8E3', tintOpacity: 0.08, flash: 0.55, halation: 0.04, rgbShift: 0.04 },
  },
  {
    id: 'kodak-funsaver',
    name: 'Kodak FunSaver',
    description: 'Disposable · Warm, yellow cast, party vibes',
    color: '#FFD580',
    isPro: true, pack: 'film', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Kodak 800',
    settings: { grain: 0.52, temperature: 0.35, vignette: 0.06, blur: 0.1, contrast: 1.08, saturation: 0.85, lightLeak: 0.26, dust: 0.25, timestamp: true, fade: 0.16, tint: '#FFD580', tintOpacity: 0.12, flash: 0.65, halation: 0.06, rgbShift: 0.06 },
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
    settings: { grain: 0.3, temperature: 0.25, vignette: 0.16, blur: 0.1, contrast: 0.85, saturation: 0.8, lightLeak: 0.24, dust: 0.12, timestamp: true, fade: 0.18, tint: '#F4E4C1', tintOpacity: 0.12, flash: 0.12, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'instax-mini',
    name: 'Instax Mini',
    description: 'Instant · Bright, slightly overexposed',
    color: '#FFF0F5',
    isPro: true, pack: 'film', cameraType: 'instant', frameType: 'polaroid', filmStock: 'Fuji Instax Mini',
    settings: { grain: 0.22, temperature: 0.15, vignette: 0.1, blur: 0.06, contrast: 0.92, saturation: 0.9, lightLeak: 0.14, dust: 0.08, timestamp: true, fade: 0.15, tint: '#FFF0F5', tintOpacity: 0.1, flash: 0.2, halation: 0.06, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  HALF-FRAME
  // ════════════════════════════════════════════════════════
  {
    id: 'olympus-pen',
    name: 'Olympus PEN',
    description: 'Half-frame · Two shots, portrait pairs',
    color: '#C8A882',
    isPro: true, pack: 'film', cameraType: 'half-frame', frameType: 'half-frame', filmStock: 'Kodak Gold 200',
    settings: { grain: 0.32, temperature: 0.2, vignette: 0.22, blur: 0.04, contrast: 1.0, saturation: 0.9, lightLeak: 0.12, dust: 0.14, timestamp: false, fade: 0.12, tint: '#C8A882', tintOpacity: 0.09, flash: 0, halation: 0.06, rgbShift: 0 },
  },
  {
    id: 'canon-demi',
    name: 'Canon Demi',
    description: 'Half-frame · Soft, vintage Japanese',
    color: '#B8A090',
    isPro: true, pack: 'film', cameraType: 'half-frame', frameType: 'half-frame', filmStock: 'Fuji 200',
    settings: { grain: 0.28, temperature: 0.15, vignette: 0.2, blur: 0.06, contrast: 0.95, saturation: 0.85, lightLeak: 0.1, dust: 0.12, timestamp: false, fade: 0.14, tint: '#B8A090', tintOpacity: 0.08, flash: 0, halation: 0.05, rgbShift: 0 },
  },

  // ════════════════════════════════════════════════════════
  //  DIGITAL Y2K
  // ════════════════════════════════════════════════════════
  {
    id: 'sony-cybershot',
    name: 'Sony Cybershot',
    description: 'Digital 2003 · Blown highlights, sharp',
    color: '#C8E6FF',
    isPro: true, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital', filmStock: '3.2MP CCD',
    settings: { grain: 0.15, temperature: 0.05, vignette: 0.03, blur: 0, contrast: 1.25, saturation: 1.2, lightLeak: 0.06, dust: 0.03, timestamp: true, fade: 0.04, tint: '#C8E6FF', tintOpacity: 0.07, flash: 0.5, halation: 0, rgbShift: 0.03 },
  },
  {
    id: 'canon-ixus',
    name: 'Canon IXUS',
    description: 'Digital 2005 · Warm, slightly soft',
    color: '#FFE0B2',
    isPro: true, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital', filmStock: '5MP CCD',
    settings: { grain: 0.12, temperature: 0.2, vignette: 0.05, blur: 0.02, contrast: 1.15, saturation: 1.1, lightLeak: 0.05, dust: 0.02, timestamp: true, fade: 0.06, tint: '#FFE0B2', tintOpacity: 0.08, flash: 0.4, halation: 0, rgbShift: 0.02 },
  },
  {
    id: 'nokia-cam',
    name: 'Nokia 3310',
    description: 'Phone 2002 · Grainy, low-res nostalgia',
    color: '#8899AA',
    isPro: true, pack: 'digital', cameraType: 'digital-y2k', frameType: 'digital',
    settings: { grain: 0.65, temperature: 0, vignette: 0.24, blur: 0.2, contrast: 1.1, saturation: 0.7, lightLeak: 0, dust: 0.05, timestamp: true, fade: 0.1, tint: '#8899AA', tintOpacity: 0.15, flash: 0, halation: 0, rgbShift: 0.08 },
  },

  // ════════════════════════════════════════════════════════
  //  8mm CINE FILM — Cine Pack
  // ════════════════════════════════════════════════════════
  {
    id: 'super8-kodachrome',
    name: 'Super 8 Kodachrome',
    description: '8mm · Warm, saturated home movies',
    color: '#DAA520',
    isPro: true, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Kodachrome 40',
    settings: { grain: 0.5, temperature: 0.38, vignette: 0.36, blur: 0.12, contrast: 0.9, saturation: 0.88, lightLeak: 0.36, dust: 0.28, timestamp: true, fade: 0.18, tint: '#DAA520', tintOpacity: 0.1, flash: 0, halation: 0.1, rgbShift: 0 },
  },
  {
    id: 'super8-bw',
    name: 'Super 8 B&W',
    description: '8mm B&W · Gritty, raw, cinematic',
    color: '#555555',
    isPro: true, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Tri-X 200',
    settings: { grain: 0.55, temperature: 0, vignette: 0.4, blur: 0.08, contrast: 1.25, saturation: 0, lightLeak: 0.16, dust: 0.3, timestamp: false, fade: 0.08, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'regular8-faded',
    name: 'Regular 8 Faded',
    description: '8mm · Heavily faded, 1960s family film',
    color: '#C8A878',
    isPro: true, pack: 'cine', cameraType: '8mm', frameType: '8mm', filmStock: 'Ektachrome 64',
    settings: { grain: 0.6, temperature: 0.3, vignette: 0.4, blur: 0.15, contrast: 0.78, saturation: 0.65, lightLeak: 0.4, dust: 0.35, timestamp: false, fade: 0.3, tint: '#C8A878', tintOpacity: 0.15, flash: 0, halation: 0.08, rgbShift: 0 },
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
    settings: { grain: 0.35, temperature: 0.05, vignette: 0.28, blur: 0.1, contrast: 1.1, saturation: 1.05, lightLeak: 0.16, dust: 0.12, timestamp: true, fade: 0.08, tint: '#4A4A8A', tintOpacity: 0.08, flash: 0, halation: 0, rgbShift: 0.1 },
  },
  {
    id: 'vhs-glitch',
    name: 'VHS Glitch',
    description: 'VHS · Corrupted tape, RGB chaos',
    color: '#00FFFF',
    isPro: false, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.6, temperature: 0, vignette: 0.4, blur: 0.2, contrast: 1.3, saturation: 1.4, lightLeak: 0.48, dust: 0.25, timestamp: true, fade: 0.05, tint: '#00FFFF', tintOpacity: 0.08, flash: 0, halation: 0, rgbShift: 0.25 },
  },
  {
    id: 'vhs-lo-fi',
    name: 'VHS Lo-Fi',
    description: 'VHS · Washed out, soft tracking',
    color: '#8B7355',
    isPro: true, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.45, temperature: 0.15, vignette: 0.28, blur: 0.18, contrast: 0.85, saturation: 0.7, lightLeak: 0.32, dust: 0.3, timestamp: true, fade: 0.2, tint: '#8B7355', tintOpacity: 0.1, flash: 0, halation: 0, rgbShift: 0.12 },
  },
  {
    id: 'vhs-neon',
    name: 'VHS Neon',
    description: 'VHS · 80s video store, neon-soaked',
    color: '#FF00FF',
    isPro: true, pack: 'vhs', cameraType: 'vhs', frameType: 'vhs',
    settings: { grain: 0.4, temperature: -0.1, vignette: 0.36, blur: 0.1, contrast: 1.25, saturation: 1.5, lightLeak: 0.44, dust: 0.15, timestamp: true, fade: 0.08, tint: '#FF00FF', tintOpacity: 0.1, flash: 0, halation: 0, rgbShift: 0.18 },
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
    settings: { grain: 0.45, temperature: 0.1, vignette: 0.56, blur: 0.05, contrast: 1.3, saturation: 1.35, lightLeak: 0.28, dust: 0.18, timestamp: false, fade: 0.05, tint: '#FF6347', tintOpacity: 0.08, flash: 0, halation: 0.08, rgbShift: 0.06 },
  },
  {
    id: 'sepia-classic',
    name: 'Sepia Classic',
    description: 'Special · Warm brown, 1900s nostalgia',
    color: '#8B6914',
    isPro: true, cameraType: 'special', frameType: 'none',
    settings: { grain: 0.35, temperature: 0.4, vignette: 0.28, blur: 0.05, contrast: 0.95, saturation: 0.15, lightLeak: 0, dust: 0.2, timestamp: false, fade: 0.2, tint: '#8B6914', tintOpacity: 0.3, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'tokyo-1998',
    name: 'Tokyo 1998',
    description: '35mm · Cyberpunk neon, green shadows',
    color: '#00FF88',
    isPro: true, pack: 'japan', cameraType: '35mm', frameType: 'none', filmStock: 'Fuji Provia 400',
    settings: { grain: 0.3, temperature: -0.4, vignette: 0.28, blur: 0.05, contrast: 1.25, saturation: 1.3, lightLeak: 0.24, dust: 0.1, timestamp: true, fade: 0.05, tint: '#00FF88', tintOpacity: 0.08, flash: 0, halation: 0.08, rgbShift: 0.05 },
  },
  {
    id: 'osaka-dusk',
    name: 'Osaka Dusk',
    description: '35mm · Purple twilight, neon reflections',
    color: '#9B59B6',
    isPro: true, pack: 'japan', cameraType: '35mm', frameType: 'none', filmStock: 'Kodak Portra 800',
    settings: { grain: 0.25, temperature: -0.2, vignette: 0.32, blur: 0.05, contrast: 1.2, saturation: 1.2, lightLeak: 0.16, dust: 0.08, timestamp: true, fade: 0.08, tint: '#9B59B6', tintOpacity: 0.12, flash: 0, halation: 0.1, rgbShift: 0 },
  },
  {
    id: 'kyoto-spring',
    name: 'Kyoto Spring',
    description: 'Instant · Cherry blossom, soft haze',
    color: '#FFB7C5',
    isPro: true, pack: 'japan', cameraType: 'instant', frameType: 'polaroid', filmStock: 'Fuji Instax',
    settings: { grain: 0.15, temperature: 0.1, vignette: 0.12, blur: 0.1, contrast: 0.9, saturation: 1.0, lightLeak: 0.12, dust: 0.05, timestamp: false, fade: 0.12, tint: '#FFB7C5', tintOpacity: 0.12, flash: 0.1, halation: 0.05, rgbShift: 0 },
  },
  {
    id: 'shibuya-crossing',
    name: 'Shibuya Crossing',
    description: 'Disposable · Motion blur, city lights',
    color: '#FFD700',
    isPro: true, pack: 'japan', cameraType: 'disposable', frameType: 'disposable', filmStock: 'Kodak 800',
    settings: { grain: 0.38, temperature: 0.1, vignette: 0.36, blur: 0.2, contrast: 1.3, saturation: 1.1, lightLeak: 0.28, dust: 0.14, timestamp: true, fade: 0.05, tint: '#FFD700', tintOpacity: 0.08, flash: 0.4, halation: 0.06, rgbShift: 0.05 },
  },
  {
    id: 'noir-detective',
    name: 'Noir Detective',
    description: '35mm B&W · Hard shadows, drama',
    color: '#111111',
    isPro: true, cameraType: '35mm', frameType: 'none', filmStock: 'Kodak T-Max 400',
    settings: { grain: 0.42, temperature: 0, vignette: 0.42, blur: 0, contrast: 1.52, saturation: 0, lightLeak: 0, dust: 0.15, timestamp: false, fade: 0, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'bleach-bypass',
    name: 'Bleach Bypass',
    description: '35mm · Silver retention, desaturated grit',
    color: '#A9A9A9',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.4, temperature: 0, vignette: 0.24, blur: 0, contrast: 1.38, saturation: 0.38, lightLeak: 0, dust: 0.12, timestamp: false, fade: 0.05, tint: '#A9A9A9', tintOpacity: 0.08, flash: 0, halation: 0, rgbShift: 0 },
  },
  {
    id: 'infrared',
    name: 'Infrared',
    description: '35mm · IR film, glowing foliage',
    color: '#FF6666',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.3, temperature: 0.1, vignette: 0.16, blur: 0.15, contrast: 1.2, saturation: 0.3, lightLeak: 0.08, dust: 0.08, timestamp: false, fade: 0.1, tint: '#FF6666', tintOpacity: 0.15, flash: 0, halation: 0.2, rgbShift: 0 },
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    description: '35mm · Hollywood blockbuster grade',
    color: '#008080',
    isPro: true, cameraType: '35mm', frameType: 'none',
    settings: { grain: 0.15, temperature: 0.2, vignette: 0.16, blur: 0, contrast: 1.15, saturation: 1.1, lightLeak: 0.08, dust: 0.03, timestamp: false, fade: 0.05, tint: '#008080', tintOpacity: 0.1, flash: 0, halation: 0.08, rgbShift: 0 },
  },
  {
    id: 'classic-m',
    name: 'Classic M',
    description: 'Rangefinder · Sharp, contrasty film look',
    color: '#333333',
    isPro: true, cameraType: '35mm', frameType: 'none', filmStock: 'Leica Style',
    settings: { grain: 0.12, temperature: -0.05, vignette: 0.2, blur: 0, contrast: 1.25, saturation: 0.95, lightLeak: 0.02, dust: 0.05, timestamp: false, fade: 0.02, tint: '#000000', tintOpacity: 0, flash: 0, halation: 0.05, rgbShift: 0 },
  },
  {
    id: 'd-classic',
    name: 'D Classic',
    description: 'Digital · 90s point-and-shoot vibe',
    color: '#C0C0C0',
    isPro: true, cameraType: 'digital-y2k', frameType: 'digital', filmStock: 'Vintage CMOS',
    settings: { grain: 0.2, temperature: 0.1, vignette: 0.12, blur: 0.02, contrast: 1.1, saturation: 0.85, lightLeak: 0.1, dust: 0.08, timestamp: true, fade: 0.1, tint: '#FFFFFF', tintOpacity: 0.05, flash: 0.3, halation: 0, rgbShift: 0.03 },
  },
  {
    id: 'ccd-r',
    name: 'CCD-R',
    description: 'CCD Sensor · Vivid colors, early digital',
    color: '#4169E1',
    isPro: true, cameraType: 'digital-y2k', frameType: 'digital', filmStock: 'CCD R-Sensor',
    settings: { grain: 0.08, temperature: 0.15, vignette: 0.06, blur: 0, contrast: 1.3, saturation: 1.35, lightLeak: 0.04, dust: 0.02, timestamp: true, fade: 0.05, tint: '#4169E1', tintOpacity: 0.08, flash: 0.2, halation: 0, rgbShift: 0.02 },
  },
  {
    id: 'd-exp',
    name: 'D-Exp',
    description: 'Experimental · High saturation, deep shadows',
    color: '#FF1493',
    isPro: true, cameraType: 'special', frameType: 'none',
    settings: { grain: 0.3, temperature: 0.2, vignette: 0.36, blur: 0.05, contrast: 1.45, saturation: 1.6, lightLeak: 0.2, dust: 0.15, timestamp: false, fade: 0.15, tint: '#FF1493', tintOpacity: 0.15, flash: 0, halation: 0.15, rgbShift: 0.08 },
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
