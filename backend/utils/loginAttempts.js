const attempts = {};

export function recordFailedAttempt(emailOrDni) {
    const key = emailOrDni.toLowerCase();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    
    if (!attempts[key]) {
        attempts[key] = { timestamps: [], warned: false };
    }

    attempts[key].timestamps.push(now);
    attempts[key].timestamps = attempts[key].timestamps.filter(ts => now - ts < windowMs);

    return {
        count: attempts[key].timestamps.length,
        warned: attempts[key].warned
    };
}

export function markWarned(emailOrDni) {
    const key = emailOrDni.toLowerCase();
    if (attempts[key]) attempts[key].warned = true;
}

export function resetAttempts(emailOrDni) {
    const key = emailOrDni.toLowerCase();
    delete attempts[key];
}