import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#FF6B00',
          pink: '#E91E8C',
          purple: '#7B2FBE',
          'dark-purple': '#4A0E8F',
        },
        surface: {
          50: '#F8F9FF',
          100: '#F0F2FF',
          200: '#E8EAFF',
          700: '#1A1B2E',
          800: '#12131F',
          900: '#0A0B14',
          950: '#05060D',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B00 0%, #E91E8C 50%, #7B2FBE 100%)',
        'brand-gradient-h': 'linear-gradient(90deg, #FF6B00 0%, #E91E8C 50%, #7B2FBE 100%)',
        'brand-gradient-v': 'linear-gradient(180deg, #FF6B00 0%, #E91E8C 50%, #7B2FBE 100%)',
        'dark-surface': 'linear-gradient(135deg, #0A0B14 0%, #12131F 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradientX 4s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(233, 30, 140, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(233, 30, 140, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'brand': '0 4px 30px rgba(233, 30, 140, 0.3)',
        'brand-lg': '0 8px 50px rgba(233, 30, 140, 0.4)',
        'glass': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'glass-light': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'inner-brand': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glow-pink': '0 0 20px rgba(233, 30, 140, 0.5)',
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.5)',
        'glow-purple': '0 0 20px rgba(123, 47, 190, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        'brand': '20px',
      },
      borderRadius: {
        'brand': '16px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
}

export default config
