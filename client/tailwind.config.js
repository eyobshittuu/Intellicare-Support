/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small devices
      },
      colors: {
        primary: {
          50: '#e8f9f8',
          100: '#c2eeec',
          200: '#9ae3df',
          300: '#72d8d2',
          400: '#4acdc5',
          500: '#27b6af',
          600: '#229891',
          700: '#1c7a73',
          800: '#175c56',
          900: '#113e39',
        },
        teal: {
          50: '#e8f9f8',
          100: '#c2eeec',
          200: '#9ae3df',
          300: '#72d8d2',
          400: '#4acdc5',
          500: '#27b6af',
          600: '#229891',
          700: '#1c7a73',
          800: '#175c56',
          900: '#113e39',
        },
      },
    },
  },
  plugins: [
    // Add scrollbar-hide utility
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
}
