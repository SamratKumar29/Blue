/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1636',
          800: '#102048',
          700: '#1B2D63',
        },
        blue: {
          50:  '#EEF4FF',
          100: '#DCE8FF',
          500: '#3B6CF6',
          600: '#2F59D9',
        },
        ink:   'var(--color-ink)',
        muted: 'var(--color-muted)',
        good:  '#2BB673',
        warn:  '#F5B83D',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 6px 24px rgba(30,60,140,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
