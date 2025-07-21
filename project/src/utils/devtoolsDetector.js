
export function detectarDevtools(callback) {
    let open = false;
    const threshold = 160;
    const check = () => {
        const ancho = window.outerWidth - window.innerWidth > threshold;
        const alto = window.outerHeight - window.innerHeight > threshold;
        if (ancho || alto) {
            if (!open) {
                open = true;
                callback(); // Se detectó inspección
            }
        } else {
            open = false;
        }
    };

    setInterval(check, 1000); // cada segundo
}
