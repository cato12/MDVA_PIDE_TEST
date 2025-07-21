// src/components/CopyBlocker.tsx
import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const CopyBlocker = () => {
    const { addToast } = useToast();

    useEffect(() => {
        const mensaje = 'Seguridad: No está permitido copiar ni pegar datos.';

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            addToast(mensaje, 'error');
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            addToast(mensaje, 'error');
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            // Bloquear Ctrl+X o Cmd+X
            if ((e.ctrlKey || e.metaKey) && key === 'x') {
                e.preventDefault();
                addToast('✂️ Cortar no está permitido.', 'error');
            }

            // Bloquear Ctrl+A o Cmd+A
            if ((e.ctrlKey || e.metaKey) && key === 'a') {
                e.preventDefault();
                addToast('🔍 Selección total no está permitida.', 'error');
            }

            // Bloquear Ctrl+S o Cmd+S
            if ((e.ctrlKey || e.metaKey) && key === 's') {
                e.preventDefault();
                addToast('💾 Guardar no está permitido.', 'error');
            }

            // Bloquear Ctrl+P o Cmd+P
            if ((e.ctrlKey || e.metaKey) && key === 'p') {
                e.preventDefault();
                addToast('🖨️ Imprimir no está permitido.', 'error');
            }

            // Bloquear Ctrl+F o Cmd+F
            if ((e.ctrlKey || e.metaKey) && key === 'f') {
                e.preventDefault();
                addToast('🔍 Búsqueda no está permitida.', 'error');
            }

            // Bloquear Ctrl+U o Cmd+U
            if ((e.ctrlKey || e.metaKey) && key === 'u') {
                e.preventDefault();
                addToast('🔍 Ver fuente no está permitido.', 'error');
            }

            // Bloquear Ctrl+Shift+J o Cmd+Option+J
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'j') {
                e.preventDefault();
                addToast('🔧 Consola de desarrollador no está permitida.', 'error');
            }

            // Bloquear Ctrl+Shift+i o Cmd+Option+i
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'i') {
                e.preventDefault();
                addToast('🔧 Consola de desarrollador no está permitida.', 'error');
            }

            // Bloquear Ctrl+Shift+R o Cmd+Shift+R
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'r') {
                e.preventDefault();
                addToast('🔄 Recargar con caché no está permitido.', 'error');
            }

            // Bloquear Ctrl+Shift+L o Cmd+Shift+L
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'l') {
                e.preventDefault();
                addToast('🔍 Barra de direcciones no está permitida.', 'error');
            }

            // Bloquear Ctrl+Shift+Y o Cmd+Shift+Y
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'y') {
                e.preventDefault();
                addToast('🔄 Rehacer no está permitido.', 'error');
            }

            // Bloquear Ctrl+Shift+Z o Cmd+Shift+Z
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z') {
                e.preventDefault();
                addToast('🔄 Rehacer no está permitido.', 'error');
            }

            // Bloquear Ctrl+Shift+H o Cmd+Shift+H
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'h') {
                e.preventDefault();
                addToast('🔍 Historial no está permitido.', 'error');
            }

            // Bloquear Ctrl+Shift+B o Cmd+Shift+B
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'b') {
                e.preventDefault();
                addToast('🔍 Marcadores no están permitidos.', 'error');
            }

            // Bloquear Ctrl+Shift+E o Cmd+Shift+E
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'e') {
                e.preventDefault();
                addToast('🔍 Extensiones no están permitidas.', 'error');
            }

            // Bloquear Ctrl+C o Cmd+C
            if ((e.ctrlKey || e.metaKey) && key === 'c') {
                e.preventDefault();
                addToast(mensaje, 'error');
            }

            // Bloquear PrintScreen
            if (key === 'printscreen') {
                e.preventDefault();
                addToast('🖼️ Captura de pantalla bloqueada.', 'error');
            }

            // // Bloquear Ctrl+Shift+S o Cmd+Shift+3/4/5
            // if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['s', '3', '4', '5'].includes(key)) {
            //     e.preventDefault();
            //     addToast('🖼️ Combinación de captura de pantalla bloqueada.', 'error');
            // }
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [addToast]);

    return null;
};

export default CopyBlocker;
