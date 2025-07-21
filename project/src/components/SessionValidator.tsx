// src/components/SessionValidator.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const SessionValidator = () => {
    const { user, logout, sessionToken } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [invalidSession, setInvalidSession] = useState(false);

    useEffect(() => {
        if (!user || !sessionToken) return;

        const validate = async () => {
            try {
                const res = await fetch('http://localhost:4000/validate-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, sessionToken }),
                });
                const data = await res.json();

                if (!data.valid) {
                    setInvalidSession(true);
                    addToast('⚠️ Se ha detectado otra sesión. Redirigiendo...', 'error');
                    setTimeout(async () => {
                        await logout();
                        navigate('/login');
                    }, 5000);
                }
            } catch (err) {
                console.error('Error al validar sesión:', err);
            }
        };

        const id = setInterval(validate, 60_000);
        validate();
        return () => clearInterval(id);
    }, [user, sessionToken]);

    // Cuando el usuario ya está en login, ocultar modal (se reseteó el contexto)
    useEffect(() => {
        if (location.pathname === '/login') {
        setInvalidSession(false);
        }
    }, [location]);

    if (!invalidSession) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 text-white p-6">
            <div className="text-center max-w-md bg-white text-gray-900 rounded-xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-[#C01702] mb-2">⚠️ Sesión inválida</h2>
                <p>Otra sesión ha sido iniciada con tus credenciales, tu sesión actual se cerrará por seguridad.</p>
                <p className="text-sm text-gray-500 mt-3">Redirigiendo en segundos...</p>
            </div>
        </div>
    );
};

export default SessionValidator;
