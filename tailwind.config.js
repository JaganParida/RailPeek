/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#006fc7',
          700: '#0158a1',
          800: '#054b84',
          900: '#0a3f6e',
          950: '#062849',
        },
        berth: {
          available: {
            bg: '#ecfdf5',
            text: '#065f46',
            border: '#a7f3d0',
            solid: '#059669',
          },
          partial: {
            bg: '#fffbeb',
            text: '#92400e',
            border: '#fde68a',
            solid: '#d97706',
          },
          occupied: {
            bg: '#f1f5f9',
            text: '#64748b',
            border: '#e2e8f0',
            solid: '#94a3b8',
          },
          unavailable: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#fecaca',
            solid: '#dc2626',
          },
          selected: {
            bg: '#eff6ff',
            text: '#1e40af',
            border: '#bfdbfe',
            solid: '#2563eb',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      boxShadow: {
        none: 'none',
        xs: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        card: 'none',
        elevated: 'none',
      },
    },
  },
  plugins: [],
};
