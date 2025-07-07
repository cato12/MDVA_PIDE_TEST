
/**
 * Header institucional para la plataforma PIDE MDVA.
 * Muestra título, subtítulo, usuario autenticado y botón de logout.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Título y subtítulo institucional
 * - Usuario autenticado (nombre y rol)
 * - Botón de cerrar sesión
 *
 * Accesibilidad:
 * - Contraste alto, foco visible, roles semánticos
 * - Botón de logout con aria-label y title
 *
 * @module Header
 */
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente Header principal del sistema.
 * Muestra información institucional y usuario autenticado.
 * Incluye botón de logout accesible.
 *
 * @returns {JSX.Element} Header institucional con usuario y logout
 */
export function Header() {
  // Obtiene usuario autenticado y función de logout del contexto global
  const { user, logout } = useAuth();

  return (
    <header
      className="bg-[#C01702] dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
      role="banner"
      aria-label="Encabezado institucional"
    >
      <div className="flex items-center justify-between">
        {/*
          Título y subtítulo institucional
          - Contraste alto y jerarquía visual clara
        */}
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">
            Sistema Web | PIDE
          </h1>
          <p className="text-sm text-white/80">
            Municipalidad Distrital de Vista Alegre
          </p>
        </div>

        {/*
          Usuario autenticado y logout
          - Muestra nombre, rol y botón de cerrar sesión
          - Accesible, con foco visible y aria-label
        */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl py-2 px-4 shadow-md">
            <div className="flex items-center gap-2">
              {/* Avatar de usuario */}
              <div className="w-8 h-8 bg-[#C01702] rounded-full flex items-center justify-center border-2 border-[#C01702]">
                <User className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <div>
                {/* Nombre y rol del usuario autenticado */}
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[160px]" title={user ? `${user.nombres} ${user.apellidos}` : ''}>
                  {user ? `${user.nombres} ${user.apellidos}` : ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300 capitalize truncate max-w-[120px]" title={user?.rol || ''}>
                  {user?.rol}
                </p>
              </div>
            </div>
            {/* Botón de logout accesible */}
            <button
              onClick={logout}
              className="p-2 text-[#C01702] hover:text-white rounded-lg hover:bg-[#C01702]/90 bg-white dark:bg-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C01702]"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}