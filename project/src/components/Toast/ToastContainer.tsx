
/**
 * ToastContainer
 * Contenedor de notificaciones flotantes minimalistas, centradas y accesibles.
 * - Animación de entrada/salida
 * - Diseño compacto y profesional
 * - Accesibilidad ARIA
 * - Iconografía y colores por tipo
 */

import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';


export function ToastContainer() {
  const { toasts, removeToast } = useToast();


  /**
   * Devuelve el icono correspondiente al tipo de toast
   */
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    }
  };


  /**
   * Devuelve la clase de fondo y borde según el tipo de toast
   */
  const getBgColor = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700';
    }
  };


  return (
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 w-full max-w-full px-2 pointer-events-none"
      aria-live="polite"
      role="region"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 min-w-[240px] max-w-sm w-full px-3 py-2 rounded-lg border shadow-sm transition-all duration-300 bg-opacity-95 backdrop-blur-sm font-sans text-sm animate-fade-in-up ${getBgColor(toast.tipo)}`}
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}
          tabIndex={0}
          role="status"
        >
          {getIcon(toast.tipo)}
          <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 truncate">
            {toast.mensaje}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C01702]"
            aria-label="Cerrar notificación"
            tabIndex={0}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {/* Animación fade-in-up (tailwind personalizada) */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.35s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}