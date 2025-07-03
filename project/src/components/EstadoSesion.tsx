import { useAuth } from '../context/AuthContext';

export function EstadoSesion() {
  const { isSessionActive } = useAuth();
  return (
    <div style={{ fontWeight: 'bold', color: isSessionActive() ? 'green' : 'red' }}>
      Sesión: {isSessionActive() ? 'Activa' : 'No activa'}
    </div>
  );
}
