/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aurora: {
          bg: 'var(--aurora-bg)',
          card: 'var(--aurora-card)',
          text: 'var(--aurora-text)',
          muted: 'var(--aurora-muted)',
          accent: 'var(--aurora-accent)',
          'accent-hover': 'var(--aurora-accent-hover)',
          'accent-text': 'var(--aurora-accent-text)',
          border: 'var(--aurora-border)',
          radar: 'var(--aurora-radar)',
          chip: 'var(--aurora-chip)',
          success: 'var(--aurora-success)',
          'success-bg': 'var(--aurora-success-bg)',
          warning: 'var(--aurora-warning)',
          'warning-bg': 'var(--aurora-warning-bg)',
          error: 'var(--aurora-error)',
          'error-bg': 'var(--aurora-error-bg)',
        },
        brand: {
          50: '#ECECFF',
          100: '#E0E2FD',
          200: '#C9CCF5',
          300: '#A4A8F2',
          400: '#7E83EE',
          500: '#5B5BF0',
          600: '#4A4AE2',
          700: '#3A3AC8',
          800: '#2E2E9E',
          900: '#1B1F3B',
          950: '#0F1123',
        },
        found: {
          50: '#E8F8EE',
          100: '#D1F2DD',
          500: '#16A34A',
          600: '#15803D',
        },
        lost: {
          50: '#FDECEC',
          100: '#FCD9D9',
          500: '#DC2626',
          600: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'Consolas', '"SF Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(27, 31, 59, 0.04), 0 1px 2px -1px rgba(27, 31, 59, 0.04)',
        'card': '0 2px 8px -2px rgba(27, 31, 59, 0.06), 0 1px 4px -1px rgba(27, 31, 59, 0.04)',
        'card-hover': '0 8px 16px -4px rgba(27, 31, 59, 0.08), 0 2px 6px -1px rgba(27, 31, 59, 0.04)',
        'card-dark': '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'card-dark-hover': '0 8px 16px -4px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 2s linear infinite',
        'radar-pulse': 'radarPulse 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        radarPulse: {
          '0%': { transform: 'scale(0.15)', opacity: '0.7' },
          '70%': { transform: 'scale(1.15)', opacity: '0.2' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
