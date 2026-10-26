import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFinaleStage } from "@/hooks/useFinaleStage";

describe("useFinaleStage", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps counting while time remains", () => {
        const { result } = renderHook(() => useFinaleStage(5000));

        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBe("counting");
    });

    it("holds at zero, clears the tiles, then reveals", () => {
        const { result } = renderHook(() => useFinaleStage(0));

        expect(result.current).toBe("counting");
        act(() => vi.advanceTimersByTime(600));
        expect(result.current).toBe("clearing");
        act(() => vi.advanceTimersByTime(700));
        expect(result.current).toBe("revealed");
    });

    it("goes back to counting when the countdown is running again", () => {
        const { result, rerender } = renderHook(({ remaining }) => useFinaleStage(remaining), {
            initialProps: { remaining: 0 as number | null },
        });
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current).toBe("revealed");

        rerender({ remaining: 60_000 });

        expect(result.current).toBe("counting");
    });

    it("plays the whole reveal again when the countdown finishes a second time", () => {
        const { result, rerender } = renderHook(({ remaining }) => useFinaleStage(remaining), {
            initialProps: { remaining: 0 as number | null },
        });
        act(() => vi.advanceTimersByTime(2000));
        rerender({ remaining: 60_000 });

        rerender({ remaining: 0 });

        expect(result.current).toBe("counting");
        act(() => vi.advanceTimersByTime(600));
        expect(result.current).toBe("clearing");
        act(() => vi.advanceTimersByTime(700));
        expect(result.current).toBe("revealed");
    });

    it("stays revealed while the countdown stays finished", () => {
        const { result, rerender } = renderHook(({ remaining }) => useFinaleStage(remaining), {
            initialProps: { remaining: 0 as number | null },
        });
        act(() => vi.advanceTimersByTime(2000));

        rerender({ remaining: 0 });
        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBe("revealed");
    });

    it("does not reveal before the countdown has a value", () => {
        const { result } = renderHook(() => useFinaleStage(null));

        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBe("counting");
    });
});
