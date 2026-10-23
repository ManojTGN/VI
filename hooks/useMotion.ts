"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
    applyMotionPreference,
    DEFAULT_MOTION,
    MOTION_STORAGE_KEY,
    parseMotionPreference,
    type MotionPreference,
} from "@/lib/motion";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

const listeners = new Set<() => void>();

let preference: MotionPreference | undefined;

function notify() {
    listeners.forEach((listener) => listener());
}

function loadPreference() {
    const saved = readStorage(MOTION_STORAGE_KEY);
    const parsed = parseMotionPreference(saved);

    if (saved && !parsed) {
        removeStorage(MOTION_STORAGE_KEY);
    }

    return parsed ?? DEFAULT_MOTION;
}

function readPreference() {
    preference ??= loadPreference();
    return preference;
}

function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === MOTION_STORAGE_KEY) {
        preference = undefined;
        notify();
    }
}

function subscribe(listener: () => void) {
    if (listeners.size === 0) {
        window.addEventListener("storage", handleStorage);
    }
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.removeEventListener("storage", handleStorage);
        }
    };
}

function readNothing() {
    return null;
}

export function resetMotionCache() {
    preference = undefined;
}

export function useMotion() {
    const motion = useSyncExternalStore(subscribe, readPreference, readNothing);

    // Keeps <html data-motion> in step with the store after a change here or in
    // another tab. The inline script covers the very first paint.
    useEffect(() => {
        if (motion) {
            applyMotionPreference(motion);
        }
    }, [motion]);

    const setMotion = useCallback((next: MotionPreference) => {
        preference = next;
        writeStorage(MOTION_STORAGE_KEY, next);
        applyMotionPreference(next);
        notify();
    }, []);

    return { motion, setMotion };
}
