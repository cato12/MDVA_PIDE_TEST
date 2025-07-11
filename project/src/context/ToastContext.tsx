
/**
 * Contexto global de notificaciones (toasts) para la aplicación.
 * Permite mostrar, ocultar y gestionar toasts de manera centralizada.
 *
 * @module ToastContext
 */
import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '../types';


/**
 * Tipado del contexto de toasts
 */
interface ToastContextType {
  toasts: Toast[];
  addToast: (mensaje: string, tipo: Toast['tipo']) => void;
  removeToast: (id: string) => void;
}




//Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ INICIO-----
// Contexto de toasts
export const ToastContext = createContext<ToastContextType | undefined>(undefined);
//Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----


/**
 * Proveedor global de toasts.
 * Envuelve la app y expone el contexto a los componentes hijos.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Muestra un nuevo toast y lo elimina automáticamente tras la duración.
   */
  const addToast = (mensaje: string, tipo: Toast['tipo']) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      mensaje,
      tipo,
      duracion: 5000
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, newToast.duracion);
  };

  /**
   * Elimina un toast por id.
   */
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}


/**
 * Hook para consumir el contexto de toasts.
 * Lanza error si se usa fuera de ToastProvider.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}