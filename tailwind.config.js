/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  resolve: {
    fallback: {
      "stream": false
    }
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#6A5ACD',
          dark: '#483D8B'
        },
        background: {
          light: '#F4F4F4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'auth-card': '0 4px 15px rgba(106, 90, 205, 0.2)'
      },
      animation: {
        'tabFadeIn': 'tabFadeIn 0.8s ease-out forwards'
      },
      keyframes: {
        tabFadeIn: {
          '0%': { 
            opacity: '0.2',
            transform: 'translateY(-6px)',
            backgroundColor: 'rgba(168, 85, 247, 0.15)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)',
            backgroundColor: 'inherit'
          }
        }
      }
    },
  },
  plugins: [],
  
}

