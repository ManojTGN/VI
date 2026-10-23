"use client";

import { useEffect, useState } from "react";
import { fetchClockOffset } from "@/lib/serverClock";

const RESYNC_AFTER_MS = 10 * 60 * 1000;
const CLOCK_JUMP_MS = 2000;

export function useClockOffset() {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let isActive = true;
        let syncedAt = 0;
        let syncedAtMonotonic = 0;

        const sync = async () => {
            syncedAt = Date.now();
            syncedAtMonotonic = performance.now();
            const next = await fetchClockOffset(window.location.href);

            if (isActive) {
                setOffset(next);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                return;
            }

            const wallElapsed = Date.now() - syncedAt;
            const monotonicElapsed = performance.now() - syncedAtMonotonic;
            const clockJumped = Math.abs(wallElapsed - monotonicElapsed) > CLOCK_JUMP_MS;

            if (clockJumped || wallElapsed > RESYNC_AFTER_MS) {
                void sync();
            }
        };

        void sync();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isActive = false;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return offset;
}
