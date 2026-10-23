import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTimezoneCache, TIMEZONE_STORAGE_KEY, useTimezone } from "@/hooks/useTimezone";
import { getLocalTimezone } from "@/lib/timezones";

describe("useTimezone", () => {
    beforeEach(() => {
        resetTimezoneCache();
    });

    it("uses the browser's zone by default", () => {
        const { result } = renderHook(() => useTimezone());

        expect(result.current.localTimezone).toBe(getLocalTimezone());
        expect(result.current.timezone).toBe(getLocalTimezone());
    });

    it("restores a saved zone", () => {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, "Asia/Tokyo");

        const { result } = renderHook(() => useTimezone());

        expect(result.current.timezone).toBe("Asia/Tokyo");
    });

    it("ignores and removes an invalid saved zone", () => {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, "Mars/Phobos");

        const { result } = renderHook(() => useTimezone());

        expect(result.current.timezone).toBe(getLocalTimezone());
        expect(localStorage.getItem(TIMEZONE_STORAGE_KEY)).toBeNull();
    });

    it("saves picks in canonical form and ignores invalid ones", () => {
        const { result } = renderHook(() => useTimezone());

        act(() => result.current.selectTimezone("america/new_york"));
        expect(result.current.timezone).toBe("America/New_York");
        expect(localStorage.getItem(TIMEZONE_STORAGE_KEY)).toBe("America/New_York");

        act(() => result.current.selectTimezone("Mars/Phobos"));
        expect(result.current.timezone).toBe("America/New_York");
    });

    it("goes back to the local zone when cleared", () => {
        const { result } = renderHook(() => useTimezone());
        act(() => result.current.selectTimezone("Asia/Tokyo"));

        act(() => result.current.clearTimezone());

        expect(result.current.timezone).toBe(getLocalTimezone());
        expect(localStorage.getItem(TIMEZONE_STORAGE_KEY)).toBeNull();
    });

    it("follows changes made in another tab, including a full clear", () => {
        const { result } = renderHook(() => useTimezone());

        localStorage.setItem(TIMEZONE_STORAGE_KEY, "Europe/London");
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", { key: TIMEZONE_STORAGE_KEY }));
        });
        expect(result.current.timezone).toBe("Europe/London");

        localStorage.clear();
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", { key: null }));
        });
        expect(result.current.timezone).toBe(getLocalTimezone());
    });

    it("keeps working in memory when storage is blocked", () => {
        const blocked = () => {
            throw new DOMException("blocked", "SecurityError");
        };
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);

        const { result } = renderHook(() => useTimezone());
        expect(result.current.timezone).toBe(getLocalTimezone());

        act(() => result.current.selectTimezone("Asia/Tokyo"));
        expect(result.current.timezone).toBe("Asia/Tokyo");
    });
});
