import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          200: '#AFA9EC',
          300: '#8F87E3',
          400: '#7065D9',
          500: '#534AB7',
          600: '#3C3489',
          700: '#2A235E',
          800: '#1A1540',
          900: '#0D0A20',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '20px',
        lg: '40px',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow':   'spin 8s linear infinite',
        'ping-slow':   'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
