/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E1F40',
          50: '#F0F4FA',
          100: '#DCE4F0',
          200: '#B9CBE1',
          300: '#8CAAD0',
          400: '#5A82B8',
          500: '#0E1F40',
          600: '#0C1A36',
          700: '#0A152C',
          800: '#081022',
          900: '#050A15',
        },
        secondary: {
          DEFAULT: '#00ADEF',
          50: '#E0F5FE',
          100: '#B3E7FC',
          200: '#80D7FA',
          300: '#4DC6F7',
          400: '#26BAF5',
          500: '#00ADEF',
          600: '#009CD7',
          700: '#0082B4',
          800: '#006B92',
          900: '#004C68',
        },
      },
    },
  },
  plugins: [],
}
