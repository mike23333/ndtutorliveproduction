/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors from PRD
        dark: {
          bg: '#242424',
          surface: '#1a1a1a',
          text: 'rgba(255, 255, 255, 0.87)',
        },
        // Light theme colors
        light: {
          bg: '#ffffff',
          surface: '#f9f9f9',
          text: '#213547',
        },
        // Accent colors
        accent: {
          primary: '#646cff',
          hover: '#535bf2',
          light: '#747bff',
        },
        // Status colors
        status: {
          success: '#4ade80',
          warning: '#fbbf24',
          error: '#ef4444',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
