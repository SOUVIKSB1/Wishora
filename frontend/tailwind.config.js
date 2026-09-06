/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--void)',
        surface: 'var(--surface)',
        glass: 'var(--glass)',
        'glass-border': 'var(--glass-border)',
        accent: {
          DEFAULT: '#C8A96E',
          hover: '#E0C58D',
          dim: '#8A6E42',
          pulse: 'rgba(200, 169, 110, 0.12)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          dim: 'var(--gold-dim)',
          glow: 'var(--gold-glow)',
          pulse: 'var(--gold-pulse)',
        },
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        pink: {
          DEFAULT: 'var(--pink)',
        },
        blue: {
          DEFAULT: 'var(--blue)',
        },
        'red-heart': 'var(--red-heart)',
      },
      fontFamily: {
        display: ['"Clash Display"', 'sans-serif'],
        body: ['Satoshi', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
        marker: ['"Permanent Marker"', 'Satisfy', 'cursive'],
      },
      boxShadow: {
        'glow-sm': '0 0 16px rgba(200, 169, 110, 0.35)',
        'glow-md': '0 0 32px rgba(200, 169, 110, 0.5)',
        'gold-glow': '0 0 24px rgba(200, 169, 110, 0.35)',
        'gold-bloom': '0 0 40px rgba(200, 169, 110, 0.55)',
        'glass-card': '0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
      },
      keyframes: {
        rotateDash: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '24' },
        },
        shimmerSweep: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        }
      },
      animation: {
        'rotate-dash': 'rotateDash 3s linear infinite',
        'shimmer-sweep': 'shimmerSweep 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
