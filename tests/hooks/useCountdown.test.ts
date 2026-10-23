import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "@/hooks/useCountdown";

const START = Date.UTC(2026, 10, 18, 23, 0, 0);

describe("useCountdown", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: START });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("stays empty until a target exists", () => {
        const { result } = renderHook(() => useCountdown(null));

        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBeNull();
    });

    it("ticks on whole seconds and stops at zero", () => {
        const { result } = renderHook(() => useCountdown(START + 3500));

        act(() => vi.advanceTimersToNextFrame());
        expect(result.current).toBe(START + 3500 - Date.now());

        act(() => vi.advanceTimersByTime(520));
        expect(Math.floor(result.current! / 1000)).toBe(2);

        act(() => vi.advanceTimersByTime(10_000));
        expect(result.current).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("is zero immediately when the target is in the past", () => {
        const { result } = renderHook(() => useCountdown(START - 60_000));

        act(() => vi.advanceTimersToNextFrame());

        expect(result.current).toBe(0);
    });

    it("corrects itself when the tab wakes up after the clock moved on", () => {
        const { result } = renderHook(() => useCountdown(START + 3_600_000));
        act(() => vi.advanceTimersToNextFrame());

        vi.setSystemTime(START + 1_800_000);
        act(() => {
            document.dispatchEvent(new Event("visibilitychange"));
        });

        expect(result.current).toBe(1_800_000);
    });

    it("restarts when the target changes", () => {
        const { result, rerender } = renderHook(({ target }) => useCountdown(target), {
            initialProps: { target: START + 10_000 },
        });
        act(() => vi.advanceTimersToNextFrame());

        rerender({ target: START + 90_000 });
        act(() => vi.advanceTimersToNextFrame());

        expect(result.current).toBe(START + 90_000 - Date.now());
    });

    it("counts from the server's time when the computer clock is wrong", () => {
        const clockOffset = 5 * 60_000;
        const { result } = renderHook(() => useCountdown(START + 3_600_000, clockOffset));

        act(() => vi.advanceTimersToNextFrame());

        expect(result.current).toBe(START + 3_600_000 - (Date.now() + clockOffset));
    });

    it("cleans up timers and listeners on unmount", () => {
        const removeListener = vi.spyOn(document, "removeEventListener");
        const { unmount } = renderHook(() => useCountdown(START + 60_000));
        act(() => vi.advanceTimersToNextFrame());

        unmount();

        expect(vi.getTimerCount()).toBe(0);
        expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    });
});
