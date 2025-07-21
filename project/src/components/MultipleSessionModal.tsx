// src/components/MultipleSessionModal.tsx
import React from 'react';

const MultipleSessionModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl text-center shadow-xl max-w-md mx-auto">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Sesión duplicada detectada</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
                Se ha iniciado sesión con tus credenciales desde otro dispositivo.
                Esta sesión será cerrada por seguridad.
            </p>
        </div>
    </div>
);

export default MultipleSessionModal;
