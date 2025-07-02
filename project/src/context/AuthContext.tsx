
/**
 * Contexto global de autenticación para la aplicación.
 * Provee usuario, login, logout y estado de carga.
 * Simula autenticación con usuarios mock y persistencia local.
 *
 * @module AuthContext
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Definición local de User para reflejar los campos de la base de datos
export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string;
  cargo: string;
  area: string;
  rol: 'trabajador' | 'administrador';
  isActive: boolean;
}


/**
 * Tipado del contexto de autenticación
 */
interface AuthContextType {
  user: User | null;
  login: (emailOrDni: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}


// Contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);


/**
 * Usuarios simulados para autenticación mock
 */
// mockUsers eliminado, ahora login es real


/**
 * Proveedor global de autenticación.
 * Envuelve la app y expone el contexto a los componentes hijos.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga usuario desde localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('municipal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * Simula login: valida usuario, rol y contraseña ('123456').
   * Persiste usuario en localStorage.
   */
  const login = async (emailOrDni: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrDni, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const user: User = {
          id: String(data.user.id),
          nombres: data.user.nombres,
          apellidos: data.user.apellidos,
          dni: data.user.dni,
          email: data.user.email,
          telefono: data.user.telefono,
          cargo: data.user.cargo_nombre || '',
          area: data.user.area_nombre || '',
          rol: data.user.rol,
          isActive: true
        };
        setUser(user);
        localStorage.setItem('municipal_user', JSON.stringify(user));
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Cierra sesión y limpia usuario de localStorage.
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('municipal_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}


/**
 * Hook para consumir el contexto de autenticación.
 * Lanza error si se usa fuera de AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}