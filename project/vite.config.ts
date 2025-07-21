// vite.config.ts
// Configuración principal de Vite para el proyecto React.
// Define plugins, optimizaciones y ajustes recomendados para desarrollo moderno.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'], // Excluye lucide-react del pre-bundling si es necesario
  },
    server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
});
