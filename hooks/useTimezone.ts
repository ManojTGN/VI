"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import { getLocalTimezone, toCanonicalTimezone } from "@/lib/timezones";

export const TIMEZONE_STORAGE_KEY = "gta6-timezone";

const listeners = new Set<() => void>();

let localTimezone: string | undefined;
let selectedTimezone: string | null | undefined;

function notify() {
    listeners.forEach((listener) => listener());
}

function loadSelectedTimezone() {
    const saved = readStorage(TIMEZONE_STORAGE_KEY);
    const timezone = toCanonicalTimezone(saved);

    if (saved && !timezone) {
        removeStorage(TIMEZONE_STORAGE_KEY);
    }

    return timezone;
}

function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === TIMEZONE_STORAGE_KEY) {
        selectedTimezone = undefined;
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

function subscribeNever() {
    return () => {};
}

function readLocalTimezone() {
    localTimezone ??= getLocalTimezone();
    return localTimezone;
}

function readSelectedTimezone() {
    if (selectedTimezone === undefined) {
        selectedTimezone = loadSelectedTimezone();
    }

    return selectedTimezone;
}

function readNothing() {
    return null;
}

export function resetTimezoneCache() {
    localTimezone = undefined;
    selectedTimezone = undefined;
}

export function useTimezone() {
    const local = useSyncExternalStore(subscribeNever, readLocalTimezone, readNothing);
    const saved = useSyncExternalStore(subscribe, readSelectedTimezone, readNothing);

    const selectTimezone = useCallback((timezone: string) => {
        const canonical = toCanonicalTimezone(timezone);

        if (!canonical) {
            return;
        }

        selectedTimezone = canonical;
        writeStorage(TIMEZONE_STORAGE_KEY, canonical);
        notify();
    }, []);

    const clearTimezone = useCallback(() => {
        selectedTimezone = null;
        removeStorage(TIMEZONE_STORAGE_KEY);
        notify();
    }, []);

    return {
        timezone: saved ?? local,
        localTimezone: local,
        selectTimezone,
        clearTimezone,
    };
}
