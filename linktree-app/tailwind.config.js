/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MeuHub Brand Colors - Flat structure for proper class generation
        'meuhub-primary': '#E8A87C',
        'meuhub-secondary': '#D4A574',
        'meuhub-accent': '#E27D60',
        'meuhub-cream': '#FDF8F5',
        'meuhub-peach': '#FCEEE6',
        'meuhub-text': '#3D3D3D',
        'meuhub-border': '#E5DDD8',
        'meuhub-coral': '#E8A87C',
        'meuhub-coral-light': '#F5D5C3',
        'meuhub-coral-dark': '#D4956B',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}