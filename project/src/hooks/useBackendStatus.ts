// src/hooks/useBackendStatus.ts
import { useEffect, useState } from 'react';

export function useBackendStatus(pingUrl = 'http://localhost:4000/status', interval = 10000) {
    const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        let isCancelled = false;

        const checkStatus = async () => {
            try {
                const res = await fetch(pingUrl);
                if (!isCancelled) {
                    setIsOnline(res.ok);
                }
            } catch {
                if (!isCancelled) setIsOnline(false);
            }
        };

        checkStatus();
        const id = setInterval(checkStatus, interval);
        return () => {
            isCancelled = true;
            clearInterval(id);
        };
    }, [pingUrl, interval]);

    return isOnline;
}
