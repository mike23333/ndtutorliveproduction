/**
 * App Color System
 * Vibrant purple/indigo gradient palette
 */

export const AppColors = {
  // === Gradient Colors ===
  gradientStart: '#1e3a8a', // blue-900
  gradientMid: '#5b21b6',   // violet-900
  gradientEnd: '#1e1b4b',   // indigo-950

  // === Background Hierarchy ===
  bgPrimary: '#1e1b4b',     // indigo-950 (darkest)
  bgSecondary: '#252047',   // slightly lighter
  bgTertiary: '#2d2854',    // card backgrounds
  bgElevated: '#363161',    // elevated elements

  // === Surface Colors (with transparency) ===
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceMedium: 'rgba(99, 102, 241, 0.2)', // indigo-500/20
  surfaceDark: 'rgba(30, 27, 75, 0.95)',
  surfaceHover: 'rgba(255, 255, 255, 0.15)',

  // === Text Colors ===
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe',  // purple-300
  textMuted: 'rgba(216, 180, 254, 0.6)', // purple-300/60
  textDark: '#1e1b4b',       // indigo-950

  // === Accent Colors ===
  accent: '#d8b4fe',         // purple-300 (primary accent)
  accentHover: '#e9d5ff',    // purple-200
  accentMuted: 'rgba(216, 180, 254, 0.15)',
  accentSubtle: 'rgba(216, 180, 254, 0.08)',
  accentPurple: '#d8b4fe',   // purple-300
  accentBlue: '#60a5fa',     // blue-400

  // === Semantic Colors ===
  success: '#4ade80',        // green-400
  successGreen: '#4ade80',   // green-400 (alias)
  successMuted: 'rgba(74, 222, 128, 0.15)',
  warning: '#fbbf24',        // amber-400
  whisperAmber: '#fbbf24',   // amber-400 (alias)
  error: '#f87171',          // red-400
  errorRose: '#f87171',      // red-400 (alias)
  errorRed: '#f87171',       // alias
  errorMuted: 'rgba(248, 113, 113, 0.15)',

  // === Border ===
  borderColor: 'rgba(129, 140, 248, 0.3)', // indigo-400/30
  borderHover: 'rgba(129, 140, 248, 0.5)',
  borderAccent: 'rgba(216, 180, 254, 0.4)',

  // === Legacy Aliases ===
  primary: '#d8b4fe',
  secondary: '#60a5fa',
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
