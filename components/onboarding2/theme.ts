// ─────────────────────────────────────────────────────────────
//  RetroCam — Onboarding2 Design System
// ─────────────────────────────────────────────────────────────

export const OB2_COLORS = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  primary: '#e8a87c',
  primaryLight: '#f0c4a0',
  primaryDark: '#c98a5e',
  gold: '#FFD166',
  secondary: '#6b8e9f',
  secondaryLight: '#8faabb',
  textPrimary: '#f5f0e8',
  textSecondary: 'rgba(245,240,232,0.6)',
  textMuted: 'rgba(245,240,232,0.4)',
  success: '#06D6A0',
  error: '#e87c7c',
  warning: '#e8c87c',
  cardBg: 'rgba(245,240,232,0.05)',
  cardBorder: 'rgba(245,240,232,0.1)',
} as const;

export const OB2_GRADIENTS = {
  cta: ['#e8a87c', '#d4a574'] as const,
  ctaGold: ['#FFD166', '#e8a87c'] as const,
  screenBg: ['#161210', '#0a0a0a'] as const,
  y2k: ['#e8a87c', '#d4a574'] as const,
  film: ['#8b7355', '#a0826d'] as const,
  disposable: ['#6b8e9f', '#8faabb'] as const,
} as const;

export const OB2_TIMING = {
  fadeInUp: 600,
  screenStagger: 120,
  lightLeakWipe: 600,
  shutterFlash: 160,
  photoDrop: 600,
  photoDropStagger: 140,
} as const;
