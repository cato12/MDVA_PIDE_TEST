/**
 * Sidebar institucional para navegación principal y control de sesión.
 * Muestra logo, timer de sesión, menú dinámico según rol y botón de logout.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Logo institucional
 * - Timer de sesión con advertencia visual
 * - Menú de navegación (según rol)
 * - Botón de cerrar sesión
 *
 * Accesibilidad:
 * - Contraste alto, foco visible, roles semánticos
 * - Timer con animación si quedan menos de 2 minutos
 *
 * @module Sidebar
 */
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom'; // Navegación entre rutas
import {
  Home,      // Icono de inicio
  Search,    // Icono de búsqueda
  Building,  // Icono de edificio (RUC)
  Users,     // Icono de usuarios
  Activity,  // Icono de logs/monitoreo
  Clock,     // Icono de reloj (timer)
  Power,     // Icono de cerrar sesión
  FileText,  // Icono de Servicio A
  TrendingUp, // Icono de Servicio B
  Calendar   // Icono de Servicio C
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext'; // Contexto de autenticación
import logoMDVA from '/imagenes/logo_mdva_rojo.png'; // Logo institucional

const SESSION_KEY = 'mdva_session_expiry';

// Menú para administradores (acceso completo)
const adminMenuItems = [
  { path: '/admin/dashboard', label: 'Panel Administrativo', icon: Home },
  { path: '/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
  { path: '/admin/logs', label: 'Monitoreo del Sistema', icon: Activity }
];

// LÓGICA PARA INICIO DE SESIÓN DINÁMICO - SERVICIOS POR USUARIO (ID) - 15/07/2025 | INICIO
const serviciosPorUsuarioId: Record<number, { path: string; label: string; icon: any }[]> = {
  39: [ // Usuario 39
    { path: '/dashboard', label: 'Panel Principal', icon: Home },
    { path: '/busqueda-dni', label: 'Búsqueda por DNI', icon: Search },
    { path: '/busqueda-ruc', label: 'Búsqueda por RUC', icon: Search },
    { path: '/servicio-a', label: 'Servicio A', icon: FileText }
  ],
  40: [ // Usuario 40
    { path: '/dashboard', label: 'Panel Principal', icon: Home },
    { path: '/busqueda-dni', label: 'Búsqueda por DNI', icon: Search },
    { path: '/busqueda-ruc', label: 'Búsqueda por RUC', icon: Search },
    { path: '/servicio-c', label: 'Servicio C', icon: Calendar }
  ],
  41: [ // Usuario 41
    { path: '/dashboard', label: 'Panel Principal', icon: Home },
    { path: '/busqueda-dni', label: 'Búsqueda por DNI', icon: Search },
    { path: '/busqueda-ruc', label: 'Búsqueda por RUC', icon: Search }
    
  ],
  61: [ // Usuario 61
    { path: '/dashboard', label: 'Panel Principal', icon: Home },
    { path: '/busqueda-dni', label: 'Búsqueda por DNI', icon: Search },
    { path: '/busqueda-ruc', label: 'Búsqueda por RUC', icon: Search }
  ]
  
};

// LÓGICA PARA INICIO DE SESIÓN DINÁMICO - SERVICIOS POR USUARIO - 15/07/2025 | FIN

/**
 * Componente Sidebar principal del sistema.
 * Determina el menú según el rol del usuario autenticado.
 * Incluye timer de sesión y botón de logout.
 */
export function Sidebar() {
  /**
   * Estado: timer de sesión (15 minutos, en segundos).
   * Se reinicia cada vez que el usuario interactúa.
   */
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const expiry = Number(stored);
      return Math.max(Math.floor((expiry - Date.now()) / 1000), 0);
    }
    const expiry = Date.now() + 15 * 60 * 1000;
    localStorage.setItem(SESSION_KEY, expiry.toString());
    return 15 * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      logout();
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          logout();
          localStorage.removeItem(SESSION_KEY);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, logout]);

// LÓGICA PARA INICIO DE SESIÓN DINÁMICO - SERVICIOS POR USUARIO - 15/07/2025 | INICIO 
  // Selección dinámica de menú según área (si es admin, usa adminMenuItems)
  let menuItems = adminMenuItems;
  if (user?.rol !== 'administrador') {
    const idusuario = Number(user?.id); // Asegura que sea un número
    menuItems = (!isNaN(idusuario) && serviciosPorUsuarioId[idusuario]) || [
      { path: '/dashboard', label: 'Panel Principal', icon: Home }
    ];
  }

// LÓGICA PARA INICIO DE SESIÓN DINÁMICO - SERVICIOS POR USUARIO - 15/07/2025 | FIN

  /**
   * Formatea segundos a mm:ss para mostrar el timer.
   * @param seconds - Segundos restantes
   * @returns string mm:ss
   */
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  /**
   * Obtiene usuario autenticado y función de logout del contexto global.
   * El menú se determina según el rol ('administrador' o 'trabajador').
   */
  

  return (
    <aside
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen flex flex-col justify-between"
      aria-label="Menú principal"
      role="navigation"
    >
      {/* Logo y timer de sesión */}
      <div className="p-6 pb-0 flex-1 flex flex-col">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-transparent rounded-lg flex items-center justify-center mb-2 overflow-hidden">
            <img
              src={logoMDVA}
              alt="Logo Municipalidad"
              className="object-contain w-24 h-24"
            />
          </div>
          {/* Timer de sesión con advertencia visual */}
          <div className="relative group my-2">
            <span
              className={`flex items-center gap-2 justify-center text-sm font-mono px-3 py-2 rounded-lg shadow-sm border border-[#C01702] bg-primary-50 dark:bg-primary-900 transition-all duration-300 ${timeLeft <= 120 ? 'animate-pulse border-red-500 text-red-700 bg-red-50 dark:bg-red-900' : 'text-[#C01702]'}`}
            >
              <Clock className={`h-4 w-4 ${timeLeft <= 120 ? 'text-red-500' : 'text-[#C01702]'}`} />
              <span>Sesión:</span>
              <span className="font-bold tracking-widest">{formatTime(timeLeft)}</span>
            </span>
            {/* Tooltip informativo accesible */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
              Tiempo restante de sesión
            </div>
          </div>
          <div className="w-full border-b border-gray-200 dark:border-gray-700 my-4"></div>
        </div>
        {/* Menú de navegación dinámico según rol */}
        <nav className="space-y-2 flex-1" aria-label="Navegación principal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-[#C01702] text-white border-r-2 border-[#C01702] shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 hover:shadow-md transition-all duration-150'
                  }`
                }
                {...({ 'aria-current': undefined })}
                children={({ isActive }) => (
                  <>
                    <span className={`flex items-center justify-center rounded-lg transition-all duration-150 ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-800'} p-2`}>
                      <Icon className={`h-5 w-5${isActive ? ' text-white' : ' text-black group-hover:text-primary-700'}`} />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
                aria-current={undefined}
              />
            );
          })}
        </nav>
      </div>
      {/* Botón de cerrar sesión (logout) */}
      <div className="p-6 pt-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group hover:shadow-md transition-all duration-150 text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 border border-transparent hover:bg-red-600 dark:hover:bg-red-700 hover:text-white focus:outline-none"
          aria-label="Cerrar sesión"
        >
          <span className="flex items-center justify-center rounded-lg p-2 bg-red-100 dark:bg-red-800 group-hover:bg-red-700 group-hover:text-white transition-all duration-150">
            <Power className="h-5 w-5 group-hover:text-white text-red-700 dark:text-red-400" />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}