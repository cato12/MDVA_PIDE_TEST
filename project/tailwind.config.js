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
    },
  },
  plugins: [],
};