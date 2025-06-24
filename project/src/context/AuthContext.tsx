
/**
 * Contexto global de autenticación para la aplicación.
 * Provee usuario, login, logout y estado de carga.
 * Simula autenticación con usuarios mock y persistencia local.
 *
 * @module AuthContext
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';


/**
 * Tipado del contexto de autenticación
 */
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'trabajador' | 'administrador') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}


// Contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);


/**
 * Usuarios simulados para autenticación mock
 */
const mockUsers: User[] = [
  {
    id: '1',
    name: 'María Elena Quispe Mamani',
    email: 'mquispe@municipalidad.gob.pe',
    role: 'trabajador',
    area: 'Recursos Humanos',
    isActive: true
  },
  {
    id: '2',
    name: 'Carlos Alberto Vargas Herrera',
    email: 'cvargas@municipalidad.gob.pe',
    role: 'administrador',
    area: 'Sistemas',
    isActive: true
  },
  {
    id: '3',
    name: 'Ana Lucía Mendoza Torres',
    email: 'amendoza@municipalidad.gob.pe',
    role: 'trabajador',
    area: 'Contabilidad',
    isActive: true
  }
];


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
  const login = async (email: string, password: string, role: 'trabajador' | 'administrador'): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const foundUser = mockUsers.find(u => u.email === email && u.role === role);
    if (foundUser && password === '123456') {
      setUser(foundUser);
      localStorage.setItem('municipal_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
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