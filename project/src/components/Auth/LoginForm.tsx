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
<div className="fixed bottom-6 right-6 z-50 group">
  {/* Tooltip flotante */}
  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
    💬 Chatea con nosotros si no puedes ingresar al sistema
    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
  </div>
  
  {/* Animación de pulso limitada */}
  <div 
    className="absolute inset-0 bg-[#25D366] rounded-full opacity-75"
    style={{
      animation: 'pulse 1s ease-in-out 2'
    }}
  ></div>
  
  {/* Botón principal */}
  <a
    href="https://wa.me/51955995155?text=Hola%2C%20necesito%20ayuda%20con%20el%20acceso%20al%20sistema"
    target="_blank"
    rel="noopener noreferrer"
    className="relative bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-xl"
    title="Contáctanos por WhatsApp"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
    </svg>
    
    {/* Indicador de notificación */}
    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
      <span className="text-white text-xs font-bold">1</span>
    </div>
  </a>
</div>
  </div>
  );
}