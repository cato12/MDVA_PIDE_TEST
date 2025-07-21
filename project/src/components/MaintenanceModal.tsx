// src/components/MaintenanceModal.tsx
export default function MaintenanceModal() {
    return (
        <div className="fixed inset-0 z-[99999] bg-black bg-opacity-80 flex items-center justify-center text-white">
            <div className="bg-white dark:bg-gray-800 text-center text-black dark:text-white p-8 rounded-xl shadow-xl max-w-sm mx-auto">
                <h2 className="text-2xl font-bold mb-2">⚙️ Modo mantenimiento</h2>
                <p className="text-sm">
                    El sistema está en mantenimiento, vuelve en unos minutos o contacta con la Oficina de Transformacion Digital.
                </p>
            </div>
        </div>
    );
}
