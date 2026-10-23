import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetMotionCache, useMotion } from "@/hooks/useMotion";
import { MOTION_STORAGE_KEY } from "@/lib/motion";

const motionAttribute = () => document.documentElement.dataset.motion;

describe("useMotion", () => {
    beforeEach(() => {
        resetMotionCache();
    });

    it("animates by default, whatever the operating system prefers", () => {
        const { result } = renderHook(() => useMotion());

        expect(result.current.motion).toBe("full");
        expect(motionAttribute()).toBe("full");
    });

    it("restores a saved choice", () => {
        localStorage.setItem(MOTION_STORAGE_KEY, "reduced");

        const { result } = renderHook(() => useMotion());

        expect(result.current.motion).toBe("reduced");
        expect(motionAttribute()).toBe("reduced");
    });

    it("ignores and removes an unreadable saved choice", () => {
        localStorage.setItem(MOTION_STORAGE_KEY, "sideways");

        const { result } = renderHook(() => useMotion());

        expect(result.current.motion).toBe("full");
        expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull();
    });

    it("saves a change and drives the attribute the CSS reads", () => {
        const { result } = renderHook(() => useMotion());

        act(() => result.current.setMotion("reduced"));

        expect(result.current.motion).toBe("reduced");
        expect(motionAttribute()).toBe("reduced");
        expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("reduced");

        act(() => result.current.setMotion("full"));

        expect(motionAttribute()).toBe("full");
        expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("full");
    });

    it("follows changes made in another tab, including a full clear", () => {
        const { result } = renderHook(() => useMotion());
        act(() => result.current.setMotion("reduced"));

        localStorage.setItem(MOTION_STORAGE_KEY, "full");
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", { key: MOTION_STORAGE_KEY }));
        });
        expect(result.current.motion).toBe("full");

        localStorage.clear();
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", { key: null }));
        });
        expect(result.current.motion).toBe("full");
    });

    it("keeps working in memory when storage is blocked", () => {
        const blocked = () => {
            throw new DOMException("blocked", "SecurityError");
        };
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);

        const { result } = renderHook(() => useMotion());
        expect(result.current.motion).toBe("full");

        act(() => result.current.setMotion("reduced"));

        expect(result.current.motion).toBe("reduced");
        expect(motionAttribute()).toBe("reduced");
    });
});
