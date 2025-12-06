// Shared color system for the entire app
// Import this in any component that needs theme colors

export const AppColors = {
  // Gradient stops
  gradientStart: '#1e3a8a', // blue-900
  gradientMid: '#5b21b6',   // violet-900
  gradientEnd: '#1e1b4b',   // indigo-950

  // Surface colors
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceMedium: 'rgba(99, 102, 241, 0.2)', // indigo-500/20
  surfaceDark: 'rgba(30, 27, 75, 0.95)',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#d8b4fe', // purple-300
  textDark: '#1e1b4b',      // indigo-950

  // Accent colors
  accentPurple: '#d8b4fe',  // purple-300
  accentBlue: '#60a5fa',    // blue-400
  successGreen: '#4ade80',  // green-400
  whisperAmber: '#fbbf24',  // amber-400
  errorRose: '#f87171',     // red-400
  errorRed: '#ef4444',      // red-500

  // Border
  borderColor: 'rgba(129, 140, 248, 0.3)', // indigo-400/30
} as const;

// Type for the colors object
export type AppColorsType = typeof AppColors;

// Gradient helper
export const gradientBackground = `linear-gradient(to bottom, ${AppColors.gradientStart} 0%, ${AppColors.gradientMid} 50%, ${AppColors.gradientEnd} 100%)`;

// Common button gradient
export const buttonGradient = `linear-gradient(135deg, ${AppColors.accentPurple} 0%, ${AppColors.accentBlue} 100%)`;
