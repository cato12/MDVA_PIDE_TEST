
/**
 * Layout principal de la plataforma PIDE MDVA.
 * Estructura la aplicación con Sidebar, Header y área de contenido.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Sidebar institucional
 * - Header superior
 * - Área principal de contenido
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste
 *
 * @module Layout
 */
import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Props del componente Layout.
 * @property children - Elementos hijos a renderizar en el área principal
 */
interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente Layout principal.
 * Estructura la vista con Sidebar, Header y contenido principal.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main
            className="p-6 flex-1 focus:outline-none"
            tabIndex={-1}
            role="main"
            aria-label="Contenido principal"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}