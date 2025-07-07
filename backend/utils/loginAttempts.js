// loginAttempts.js
const attempts = {};

/**
 * Registra un intento fallido y devuelve la cantidad de intentos recientes.
 */
export function recordFailedAttempt(emailOrDni) {
    const key = emailOrDni.toLowerCase();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos

    if (!attempts[key]) attempts[key] = [];
    attempts[key].push(now);

    // Filtrar sólo últimos 15 minutos
    attempts[key] = attempts[key].filter(ts => now - ts < windowMs);

    return attempts[key].length;
}

/**
 * Reinicia los intentos fallidos para un usuario.
 */
export function resetAttempts(emailOrDni) {
    const key = emailOrDni.toLowerCase();
    delete attempts[key];
}
