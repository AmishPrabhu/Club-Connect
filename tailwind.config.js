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
        'college-gold': '#2563eb', // Replaced with Blue-600
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Merriweather', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
};
