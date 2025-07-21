import { useEffect, useState } from 'react';

// Utilidad ? 
// import { useNetworkStatus } from '../hooks/useNetworkStatus';

type NetStatus = 'online' | 'offline' | null;

export default function NetworkNotification() {
    const [status, setStatus] = useState<NetStatus>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const showStatus = (newStatus: NetStatus) => {
            setStatus(newStatus);
            setVisible(true);
            // Oculta después de 10 segundos
            //setTimeout(() => setVisible(false), 10000);
        };

        const onOnline = () => showStatus('online');
        const onOffline = () => showStatus('offline');

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        // Verifica estado inicial
        if (!navigator.onLine) {
            showStatus('offline');
        }

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    if (!visible || status === null) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
            <div className={`relative px-6 py-4 rounded-lg shadow-xl text-white max-w-sm w-full text-center
        ${status === 'online' ? 'bg-green-600' : 'bg-red-600'}`}>

                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-1 right-2 text-white text-lg hover:text-gray-200"
                    title="Cerrar"
                >
                    ✖
                </button>

                <h2 className="text-lg font-bold mb-2">
                    {status === 'online' ? '✅ Conexión restaurada' : '⚠️ Sin conexión a Internet'}
                </h2>
                <p className="text-sm">
                {status === 'online' ? (
                    'Puedes continuar usando el sistema con normalidad.'
                ) : (
                    <>
                    Parece que perdiste la conexión, algunas funciones pueden no estar disponibles.
                    <br />
                    Contacta con la Oficina de Transformación Digital.
                    </>
                )}
                </p>
            </div>
        </div>
    );
}
