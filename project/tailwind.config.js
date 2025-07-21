// tailwind.config.js
// Configuración principal de Tailwind CSS para el proyecto React + Vite.
// Define rutas de escaneo, modo oscuro y paleta de colores personalizada.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Habilita el modo oscuro por clase
  theme: {
    extend: {
      colors: {
        // Paleta de colores principal institucional
        primary: {
          50: '#fbeceb',
          100: '#f6d2cf',
          200: '#eea7a0',
          300: '#e67b70',
          400: '#de5041',
          500: '#C01702', // Color principal
          600: '#a01402',
          700: '#801102',
          800: '#600d01',
          900: '#400901',
        },
      },
      animation: {
        'pulse-realistic': 'pulse-realistic 2s ease-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-realistic': {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '0.8',
            filter: 'blur(0px)'
          },
          '70%': { 
            transform: 'scale(1.7)', 
            opacity: '0.1',
            filter: 'blur(2px)'
          },
          '100%': { 
            transform: 'scale(2)', 
            opacity: '0',
            filter: 'blur(3px)'
          },
        },
        'pulse-subtle': {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '0.6',
            filter: 'blur(0px)'
          },
          '50%': { 
            transform: 'scale(1.2)', 
            opacity: '0.3',
            filter: 'blur(0.5px)'
          },
          '100%': { 
            transform: 'scale(1.4)', 
            opacity: '0',
            filter: 'blur(1px)'
          },
        },
      },
    },
  },
  plugins: [],
};