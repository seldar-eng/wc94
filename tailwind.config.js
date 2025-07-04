/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cm-dark-green': '#003118',
        'cm-green': '#004220',
        'cm-blue': '#1a2c5a',
        'cm-cyan': '#65c8cf',
        'cm-yellow': '#f5f500',
        'cm-cream': '#e0e0e0',
        'cm-gray-dark': '#1a1a1a',
        'cm-gray-light': '#555555',
        'cm-confirm-green': '#008000',
      },
      fontFamily: {
        'sans': ['"VT323"', 'monospace'],
        'mono': ['"VT323"', 'monospace'],
      },
      fontSize: {
        'xxs': '0.75rem',
      },
      letterSpacing: {
        'normal': '1px',
      }
    },
  },
  plugins: [],
}