// src/hooks/useSessionValidation.ts
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const useSessionValidation = () => {
    const { user, logout, sessionToken } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !sessionToken) return;

        const validate = async () => {
            try {
                const res = await fetch('http://localhost:4000/validate-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, sessionToken }),
                });
                if (!res.ok) {
                    console.error('validate-session HTTP error', res.status);
                    return;
                }
                const data = await res.json();

                if (!data.valid) {
                    addToast('⚠️ Se ha detectado otra sesión. Redirigiendo...', 'error');

                    // Forzar cierre de sesión y redirección en breve
                    setTimeout(async () => {
                        await logout();
                        navigate('/login');
                    }, 5000); // 5 segundos
                }
            } catch (err) {
                console.error('Error al validar sesión:', err);
            }
        };

        const id = setInterval(validate, 60_000); // cada 60 segundos
        validate(); // validación inmediata también
        return () => clearInterval(id);
    }, [user, sessionToken, logout, navigate, addToast]);
};
