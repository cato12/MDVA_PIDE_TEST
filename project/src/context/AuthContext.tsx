import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isSessionActive as checkSessionActive } from '../utils/session';

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

type LoginStatus = 'success' | 'suspendido' | 'no_encontrado' | 'contraseña' | 'error';

type AuthContextType = {
  user: User | null;
  login: (emailOrDni: string, password: string) => Promise<LoginStatus>;
  logout: () => void;
  isLoading: boolean;
  isSessionActive: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('municipal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrDni: string, password: string): Promise<"success" | "suspendido" | "no_encontrado" | "contraseña" | "error"> => {
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
        const expiry = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('mdva_session_expiry', expiry.toString());
        setIsLoading(false);
        return 'success';
      }
      if (data.error === 'Cuenta suspendida') return 'suspendido';
      if (data.error === 'Usuario no encontrado') return 'no_encontrado';
      if (data.error === 'Contraseña incorrecta') return 'contraseña';
      setIsLoading(false);
      return 'error';
    } catch (error) {
      setIsLoading(false);
      return 'error';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('municipal_user');
  };

  const isSessionActive = () => checkSessionActive();

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isSessionActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
