"use client";

import { useEffect, useState } from "react";

const documentEvents = ["visibilitychange", "resume"];
const windowEvents = ["focus", "pageshow"];

export function useCountdown(target: number | null, clockOffset = 0) {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (target === null) {
            return;
        }

        let timeoutId: number | undefined;

        const tick = () => {
            window.clearTimeout(timeoutId);
            const next = Math.max(0, target - (Date.now() + clockOffset));
            setRemaining(next);

            if (next > 0) {
                timeoutId = window.setTimeout(tick, (next % 1000 || 1000) + 20);
            }
        };

        const resync = () => {
            if (document.visibilityState === "visible") {
                tick();
            }
        };

        const frameId = requestAnimationFrame(tick);
        documentEvents.forEach((name) => document.addEventListener(name, resync));
        windowEvents.forEach((name) => window.addEventListener(name, resync));

        return () => {
            cancelAnimationFrame(frameId);
            window.clearTimeout(timeoutId);
            documentEvents.forEach((name) => document.removeEventListener(name, resync));
            windowEvents.forEach((name) => window.removeEventListener(name, resync));
        };
    }, [target, clockOffset]);

    return remaining;
}
