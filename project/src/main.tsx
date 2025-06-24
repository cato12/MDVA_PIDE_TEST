/**
 * main.tsx
 * Punto de entrada de la aplicación React.
 * Renderiza el componente raíz <App /> dentro del elemento #root.
 * Aplica StrictMode para mejores prácticas y chequeos adicionales en desarrollo.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
