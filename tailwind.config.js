/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'college-blue': {
          primary: '#002147', // Deep Royal Blue
          secondary: '#003366',
          900: '#00152e',
        },
        'college-gold': '#DAA520', // Academic Gold
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Merriweather', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
};
