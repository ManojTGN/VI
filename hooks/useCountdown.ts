"use client";

import { useEffect, useState } from "react";

const documentEvents = ["visibilitychange", "resume"];
const windowEvents = ["focus", "pageshow"];

export function useCountdown(target: number | null, clockOffset = 0, host?: Window | null) {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (target === null) {
            return;
        }

        const view = host ?? window;
        const hostDocument = view.document;
        let timeoutId: number | undefined;

        const tick = () => {
            view.clearTimeout(timeoutId);
            const next = Math.max(0, target - (Date.now() + clockOffset));
            setRemaining(next);

            if (next > 0) {
                timeoutId = view.setTimeout(tick, (next % 1000 || 1000) + 20);
            }
        };

        const resync = () => {
            if (hostDocument.visibilityState === "visible") {
                tick();
            }
        };

        timeoutId = view.setTimeout(tick, 0);
        documentEvents.forEach((name) => hostDocument.addEventListener(name, resync));
        windowEvents.forEach((name) => view.addEventListener(name, resync));

        return () => {
            view.clearTimeout(timeoutId);
            documentEvents.forEach((name) => hostDocument.removeEventListener(name, resync));
            windowEvents.forEach((name) => view.removeEventListener(name, resync));
        };
    }, [target, clockOffset, host]);

    return remaining;
}
