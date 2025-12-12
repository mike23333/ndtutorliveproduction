/**
 * App Color System
 *
 * A restrained purple/indigo palette.
 * Each value has one purpose. Aliases exist only for semantic clarity.
 */

export const AppColors = {
  // === Gradient ===
  gradientStart: '#1e3a8a',
  gradientMid: '#5b21b6',
  gradientEnd: '#1e1b4b',

  // === Backgrounds (solid, darkest to lightest) ===
  bgPrimary: '#1e1b4b',
  bgSecondary: '#252047',
  bgTertiary: '#2d2854',
  bgElevated: '#363161',

  // === Surfaces (transparent overlays, consistent 0.05 steps) ===
  surface05: 'rgba(255, 255, 255, 0.05)',
  surface10: 'rgba(255, 255, 255, 0.10)',
  surface15: 'rgba(255, 255, 255, 0.15)',
  surface20: 'rgba(255, 255, 255, 0.20)',
  surfaceDark: 'rgba(30, 27, 75, 0.95)',
  // Semantic aliases
  surfaceLight: 'rgba(255, 255, 255, 0.10)',
  surfaceHover: 'rgba(255, 255, 255, 0.15)',

  // === Text ===
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe',
  textMuted: 'rgba(216, 180, 254, 0.6)',
  textDark: '#1e1b4b',

  // === Accent (purple-300 is the signature) ===
  accent: '#d8b4fe',
  accentHover: '#e9d5ff',
  accentMuted: 'rgba(216, 180, 254, 0.15)',
  accentSubtle: 'rgba(216, 180, 254, 0.08)',

  // === Semantic ===
  success: '#4ade80',
  successMuted: 'rgba(74, 222, 128, 0.15)',
  warning: '#fbbf24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#f87171',
  errorMuted: 'rgba(248, 113, 113, 0.15)',

  // === Borders (lighter than before for breathing room) ===
  borderColor: 'rgba(129, 140, 248, 0.2)',
  borderHover: 'rgba(129, 140, 248, 0.35)',
  borderAccent: 'rgba(216, 180, 254, 0.3)',

  // === Legacy aliases (for backward compatibility, prefer canonical names) ===
  primary: '#d8b4fe',
  accentPurple: '#d8b4fe',
  accentBlue: '#60a5fa',
  secondary: '#60a5fa',
  successGreen: '#4ade80',
  whisperAmber: '#fbbf24',
  errorRose: '#f87171',
  errorRed: '#f87171',
  surfaceMedium: 'rgba(255, 255, 255, 0.15)',
} as const;

// Type for the colors object
export type AppColorsType = typeof AppColors;

/**
 * Gradient background helper
 */
export const gradientBackground = `linear-gradient(to bottom, ${AppColors.gradientStart} 0%, ${AppColors.gradientMid} 50%, ${AppColors.gradientEnd} 100%)`;

/**
 * Common button gradient
 */
export const buttonGradient = AppColors.accent;

/**
 * Card background with subtle gradient
 */
export const cardGradient = `linear-gradient(135deg, ${AppColors.accentPurple}22 0%, ${AppColors.accentBlue}22 100%)`;

/**
 * Spacing scale (in px)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Border radius
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

/**
 * Typography scale
 */
export const typography = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;
