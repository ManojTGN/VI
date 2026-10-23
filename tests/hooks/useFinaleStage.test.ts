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
        const { result } = renderHook(() => useFinaleStage(5000, 1));

        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBe("counting");
    });

    it("holds at zero, clears the tiles, then reveals", () => {
        const { result } = renderHook(() => useFinaleStage(0, 1));

        expect(result.current).toBe("counting");
        act(() => vi.advanceTimersByTime(600));
        expect(result.current).toBe("clearing");
        act(() => vi.advanceTimersByTime(700));
        expect(result.current).toBe("revealed");
    });

    it("goes back to counting when the target moves into the future", () => {
        const { result, rerender } = renderHook(
            ({ remaining, target }) => useFinaleStage(remaining, target),
            { initialProps: { remaining: 0 as number | null, target: 1 } },
        );
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current).toBe("revealed");

        rerender({ remaining: 60_000, target: 2 });

        expect(result.current).toBe("counting");
    });

    it("does not reveal before the countdown has a value", () => {
        const { result } = renderHook(() => useFinaleStage(null, null));

        act(() => vi.advanceTimersByTime(5000));

        expect(result.current).toBe("counting");
    });
});
