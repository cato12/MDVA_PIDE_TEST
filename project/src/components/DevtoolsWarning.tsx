import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DevtoolsWarning() {
    const [secondsLeft, setSecondsLeft] = useState(5);
    const [visible, setVisible] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return; // Solo cuenta atrás si hay sesión

        const countdown = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const autoLogout = setTimeout(() => {
            logout();
            navigate('/login');
            setVisible(false);
        }, 5000);

        return () => {
            clearInterval(countdown);
            clearTimeout(autoLogout);
        };
    }, [user, logout, navigate]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-yellow-100 border border-yellow-500 text-yellow-800 px-4 py-3 rounded shadow-lg animate-bounce-in">
            <strong className="font-bold">⚠️ Uso no permitido:</strong>
            <span className="block text-sm mt-1">
                El sistema ha detectado herramientas de inspección.
            </span>
            {user ? (
                <span className="block text-xs mt-2 text-red-600 font-semibold">
                    Por seguridad, su sesión se cerrará en {secondsLeft} segundos.
                </span>
            ) : (
                <span className="block text-xs mt-2 text-yellow-700 font-medium">
                    Esta acción está monitoreada. No está permitido para visitantes.
                </span>
            )}
        </div>
    );
}
