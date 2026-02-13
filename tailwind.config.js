/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        reunion: {
          red: '#E52D27',
          gold: '#FFD700',
          green: '#00843D',
          blue: '#0055A4',
        },
        dark: {
          900: '#0a0a0f',
          800: '#13131a',
          700: '#1c1c26',
          600: '#252532',
        }
      },
      fontFamily: {
        gaming: ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(229, 45, 39, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(229, 45, 39, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
