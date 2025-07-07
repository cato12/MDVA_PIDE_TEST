/**
 * Formulario de inicio de sesión institucional.
 * Permite autenticación de usuarios y acceso rápido de demostración.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Imagen institucional
 * - Formulario de login
 * - Acceso rápido de demostración
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module LoginForm
 */
import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function LoginForm() {
  // Estado del formulario de login
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'trabajador' as 'trabajador' | 'administrador'
  });
  const { login, isLoading } = useAuth();
  const { addToast } = useToast();

  const [attempts, setAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('loginAttempts');
    return saved ? parseInt(saved) : 0;
  });
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  /**
   * Envía el formulario de login y muestra feedback.
   */
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const success = await login(formData.email, formData.password);
  //   if (success) {
  //     addToast('Inicio de sesión exitoso', 'success');
  //   } else {
  //     addToast('Credenciales inválidas', 'error');
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (isBlocked) {
    addToast('Has superado el número máximo de intentos. Intenta más tarde.', 'error');
    return;
  }

  const status = await login(formData.email, formData.password);
  if (status === 'success') {
    addToast('Inicio de sesión exitoso', 'success');
    localStorage.removeItem('loginAttempts');
    setAttempts(0);
    return;
  } 
  if (status === 'suspendido') {
    addToast('🛑 Tu cuenta ha sido suspendida.', 'error');
    addToast('🛑 Contacta a la Oficina de Transformación Digital.', 'error');
    return;
  }
  const newAttempts = attempts + 1;
  setAttempts(newAttempts);
  localStorage.setItem('loginAttempts', String(newAttempts));
  if (status === 'no_encontrado') {
      addToast('⚠️ Usuario no encontrado. Verifica tu correo o DNI.', 'error');
  } else if (status === 'contraseña') {
    addToast(`❌ Contraseña incorrecta (${newAttempts}/3)`, 'error');
  } else {
    addToast('Error desconocido al iniciar sesión.', 'error');
  }
  if (newAttempts >= 3) {
    setIsBlocked(true);
    addToast('Has fallado 3 veces. Acceso bloqueado temporalmente.', 'error');
      // 🔁 Desbloqueo automático en 5 minutos (opcional)
    setTimeout(() => {
      setAttempts(0);
      setIsBlocked(false);
      localStorage.removeItem('loginAttempts');
    }, 5 * 60 * 1000); // 5 min
  } else {
    addToast(`Intento fallido (${newAttempts}/3).`, 'error');
  }
};

  return (
    <div className="min-h-screen bg-[#FFFFF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex items-center">
      {/* Imagen decorativa a la izquierda, solo visible en md+ */}
      <div className="hidden md:flex flex-1 h-full items-stretch justify-end">
        <div className="w-full h-full">
          <img src="/imagenes/banner_mdva.jpg" alt="Ilustración" className="w-full h-full object-cover"/>
        </div>
      </div>
      <div className="flex justify-center flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-21 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white">
            <img src="/imagenes/logo_gob.pe.png" alt="Logo Municipalidad" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-wider font-sans drop-shadow-md" style={{fontFamily: 'Montserrat, Inter, Arial, sans-serif'}}>
            PIDE <span className="text-primary-600 dark:text-primary-400">-</span> MDVA
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuario
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C01702] transition-colors duration-300" />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C01702] focus:ring-2 focus:ring-[#C01702]/30 transition duration-300 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese su usuario o ID"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#C01702] transition-colors duration-300" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#C01702] focus:ring-2 focus:ring-[#C01702]/30 transition duration-300 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
          </div>
          <button
              type="submit"
              disabled={isLoading || isBlocked}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Recuerde que solo tiene 3 intentos para iniciar sesión
            </span>
          </div>
        </form>
      </div>
        </div>
      </div>
  );
}