/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mauve: {
          50: '#FAF8FC',
          100: '#F3EEF7',
          200: '#E8DFF0',
          300: '#D4C1E3',
          400: '#B491C8',
          500: '#9B6FB4',
          600: '#8B5A9F',
          700: '#6F4780',
          800: '#5A3966',
          900: '#4A2F54',
        },
        coral: {
          50: '#FFF5F5',
          100: '#FFE5E7',
          200: '#FFD1D5',
          300: '#FFB4B4',
          400: '#FF8B94',
          500: '#FF6B7A',
          600: '#F04556',
          700: '#D92D3E',
          800: '#B82333',
          900: '#9A1E2F',
        },
        cream: {
          50: '#FFFCF7',
          100: '#FFF4E6',
          200: '#FFE8CC',
          300: '#FFD9A8',
          400: '#FFC77A',
          500: '#FFB44D',
          600: '#F59E20',
          700: '#CC7F0A',
          800: '#A36408',
          900: '#7A4B06',
        },
        lavender: {
          50: '#FAFAFC',
          100: '#F5F4F8',
          200: '#E8E4F3',
          300: '#D6CEE6',
          400: '#C0B5D6',
          500: '#A89BC4',
          600: '#8B7CA8',
          700: '#6F5F8A',
          800: '#584C6E',
          900: '#463D57',
        },
      },
      fontFamily: {
        serif: ['Canela', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(139, 90, 159, 0.05)',
        'soft-md': '0 4px 6px rgba(139, 90, 159, 0.1)',
        'soft-lg': '0 10px 15px rgba(139, 90, 159, 0.15)',
        'soft-xl': '0 20px 25px rgba(139, 90, 159, 0.2)',
      },
      backgroundImage: {
        'gradient-purple-coral': 'linear-gradient(135deg, #B491C8 0%, #FF6B7A 100%)',
        'gradient-pink-cream': 'linear-gradient(135deg, #FFB4B4 0%, #FFF4E6 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8B5A9F 0%, #B491C8 100%)',
      },
    },
  },
  plugins: [],
}

