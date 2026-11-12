/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (replace with official colors later)
        deepInk: '#0E0F1A',
        warmPaper: '#FAF7F2',
        vividOrange: '#FF4B2B',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      spacing: {
        // Header heights
        header: '80px',
        headerShrunk: '56px',
      },
      transitionProperty: {
        height: 'height',
      },
    },
  },
  plugins: [],
};

