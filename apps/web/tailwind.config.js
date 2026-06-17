/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Fonts ──────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // ─── Color tokens ────────────────────────────────────────────────────────
      // primary   → Amber warm  — energetic, like warm traditional market lighting
      // secondary → Teal fresh  — clean counterpoint to amber's heat
      // accent    → Indigo      — existing analytics/prediction color (kept compatible)
      // warm      → Stone-based neutral — replaces cold gray, slight earthy warmth
      // Semantic: success / danger (warning reuses primary amber)
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          DEFAULT: '#d97706',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
          DEFAULT: '#0d9488',
        },
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: '#4f46e5',
        },
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          DEFAULT: '#16a34a',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          DEFAULT: '#e11d48',
        },
      },

      // ─── Shadows — warm-tinted (rgb(20 10 0) vs pure black) ─────────────────
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgb(20 10 0 / 0.04)',
        warm: '0 1px 3px 0 rgb(20 10 0 / 0.07), 0 1px 2px -1px rgb(20 10 0 / 0.04)',
        'warm-md':
          '0 4px 6px -1px rgb(20 10 0 / 0.07), 0 2px 4px -2px rgb(20 10 0 / 0.04)',
        'warm-lg':
          '0 10px 15px -3px rgb(20 10 0 / 0.07), 0 4px 6px -4px rgb(20 10 0 / 0.04)',
        'warm-xl':
          '0 20px 25px -5px rgb(20 10 0 / 0.07), 0 8px 10px -6px rgb(20 10 0 / 0.04)',
        card: '0 1px 3px rgb(20 10 0 / 0.06), 0 1px 2px rgb(20 10 0 / 0.04)',
        'card-hover':
          '0 4px 12px rgb(20 10 0 / 0.08), 0 2px 4px rgb(20 10 0 / 0.04)',
        'inner-warm': 'inset 0 1px 2px rgb(20 10 0 / 0.06)',
      },

      // ─── Border radius additions ─────────────────────────────────────────────
      borderRadius: {
        card: '1rem',    // 16px — standard card
        panel: '1.25rem', // 20px — larger panels
      },
    },
  },
  plugins: [],
}
