"use client";

import { useEffect, useState } from "react";
import { measureClockOffset } from "@/lib/serverClock";
import { BASE_PATH } from "@/lib/site";

const TIME_ENDPOINT = `${BASE_PATH}/api/time`;
const PERIODIC_SYNC_MS = 5 * 60 * 1000;
const CLOCK_CHECK_MS = 30 * 1000;
const MIN_SYNC_GAP_MS = 15 * 1000;
const CLOCK_JUMP_MS = 2000;
const MIN_CHANGE_MS = 250;

export function useClockOffset() {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let controller: AbortController | null = null;
        let lastSyncAt = Number.NEGATIVE_INFINITY;
        let lastWall = Date.now();
        let lastMonotonic = performance.now();

        const isVisible = () => document.visibilityState === "visible";

        const sync = async (force: boolean) => {
            const startedAt = performance.now();

            if (!isVisible() || (!force && startedAt - lastSyncAt < MIN_SYNC_GAP_MS)) {
                return;
            }

            lastSyncAt = startedAt;
            controller?.abort();
            const current = new AbortController();
            controller = current;

            const measured = await measureClockOffset(TIME_ENDPOINT, { signal: current.signal });

            if (measured === null || current.signal.aborted) {
                return;
            }

            setOffset((previous) =>
                Math.abs(measured - previous) < MIN_CHANGE_MS ? previous : measured,
            );
        };

        const checkClock = (resyncAfter: number) => {
            const wall = Date.now();
            const monotonic = performance.now();
            const drift = wall - lastWall - (monotonic - lastMonotonic);
            lastWall = wall;
            lastMonotonic = monotonic;

            if (Math.abs(drift) > CLOCK_JUMP_MS) {
                void sync(true);
            } else if (monotonic - lastSyncAt >= resyncAfter) {
                void sync(false);
            }
        };

        const handleReturn = () => {
            if (isVisible()) {
                checkClock(MIN_SYNC_GAP_MS);
            }
        };

        const listeners: [EventTarget, string][] = [
            [document, "visibilitychange"],
            [document, "resume"],
            [window, "focus"],
            [window, "pageshow"],
            [window, "online"],
        ];

        const intervalId = window.setInterval(() => checkClock(PERIODIC_SYNC_MS), CLOCK_CHECK_MS);
        listeners.forEach(([target, name]) => target.addEventListener(name, handleReturn));
        void sync(true);

        return () => {
            controller?.abort();
            window.clearInterval(intervalId);
            listeners.forEach(([target, name]) => target.removeEventListener(name, handleReturn));
        };
    }, []);

    return offset;
}
