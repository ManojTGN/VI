import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClockOffset } from "@/hooks/useClockOffset";

const START = Date.UTC(2026, 9, 26, 12, 0, 0);
const FIVE_MINUTES = 5 * 60_000;

let serverSkew = 0;
let visibility: DocumentVisibilityState = "visible";

async function serverTime(_url: string, init?: RequestInit) {
    if (init?.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }

    return new Response(JSON.stringify({ now: Date.now() + serverSkew }), {
        headers: { "content-type": "application/json" },
    });
}

const fetchTime = vi.fn(serverTime);

function setVisibility(state: DocumentVisibilityState) {
    visibility = state;
    document.dispatchEvent(new Event("visibilitychange"));
}

async function flush() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
    });
}

async function advance(milliseconds: number) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(milliseconds);
    });
}

describe("useClockOffset", () => {
    beforeEach(() => {
        vi.useFakeTimers({
            now: START,
            toFake: [
                "setTimeout",
                "clearTimeout",
                "setInterval",
                "clearInterval",
                "Date",
                "performance",
            ],
        });
        serverSkew = 0;
        visibility = "visible";
        fetchTime.mockReset();
        fetchTime.mockImplementation(serverTime);
        vi.stubGlobal("fetch", fetchTime);
        vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("measures the computer clock against the server on load", async () => {
        serverSkew = 2 * 86_400_000;

        const { result } = renderHook(() => useClockOffset());
        await flush();

        expect(fetchTime).toHaveBeenCalledWith(
            "/VI/api/time",
            expect.objectContaining({ cache: "no-store" }),
        );
        expect(result.current).toBe(2 * 86_400_000);
    });

    it("keeps re-syncing while the page stays open for days", async () => {
        const { result } = renderHook(() => useClockOffset());
        await flush();
        const callsAfterLoad = fetchTime.mock.calls.length;

        serverSkew = 4000;
        await advance(FIVE_MINUTES + 30_000);
        expect(result.current).toBe(4000);

        await advance(3 * 86_400_000);
        expect(fetchTime.mock.calls.length).toBeGreaterThan(callsAfterLoad + 3 * 12 * 24 * 3 - 10);
    });

    it("does not sync while hidden and catches up as soon as the tab is back", async () => {
        const { result } = renderHook(() => useClockOffset());
        await flush();

        act(() => setVisibility("hidden"));
        fetchTime.mockClear();
        serverSkew = 9000;
        await advance(60 * 60_000);
        expect(fetchTime).not.toHaveBeenCalled();

        act(() => setVisibility("visible"));
        await flush();
        expect(fetchTime).toHaveBeenCalled();
        expect(result.current).toBe(9000);
    });

    it("rate-limits rapid tab switching", async () => {
        renderHook(() => useClockOffset());
        await flush();
        await advance(20_000);
        fetchTime.mockClear();

        for (let switches = 0; switches < 5; switches++) {
            act(() => setVisibility("hidden"));
            act(() => setVisibility("visible"));
            await flush();
        }

        expect(fetchTime.mock.calls.length).toBeLessThanOrEqual(3);
    });

    it("re-syncs immediately when the computer clock jumps", async () => {
        const { result } = renderHook(() => useClockOffset());
        await flush();

        vi.setSystemTime(Date.now() - 60 * 60_000);
        serverSkew = 60 * 60_000;
        await advance(30_000);

        expect(result.current).toBe(60 * 60_000);
    });

    it("keeps the last good correction when the network fails", async () => {
        serverSkew = 120_000;
        const { result } = renderHook(() => useClockOffset());
        await flush();
        expect(result.current).toBe(120_000);

        fetchTime.mockRejectedValue(new TypeError("Failed to fetch"));
        await advance(FIVE_MINUTES + 30_000);
        expect(result.current).toBe(120_000);

        fetchTime.mockReset();
        fetchTime.mockImplementation(
            async () =>
                new Response(JSON.stringify({ now: Date.now() + 125_000 }), {
                    headers: { "content-type": "application/json" },
                }),
        );
        act(() => {
            window.dispatchEvent(new Event("online"));
        });
        await flush();
        expect(result.current).toBe(125_000);
    });

    it("ignores tiny differences so the display does not jitter", async () => {
        serverSkew = 10_000;
        const { result } = renderHook(() => useClockOffset());
        await flush();

        serverSkew = 10_120;
        await advance(FIVE_MINUTES + 30_000);

        expect(result.current).toBe(10_000);
    });

    it("uses only the newest answer when syncs overlap", async () => {
        let releaseStale: () => void = () => {};
        fetchTime.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    releaseStale = () =>
                        resolve(
                            new Response(JSON.stringify({ now: Date.now() - 999_999 }), {
                                headers: { "content-type": "application/json" },
                            }),
                        );
                }),
        );

        const { result } = renderHook(() => useClockOffset());
        vi.setSystemTime(Date.now() - 10_000);
        serverSkew = 13_000;
        await advance(30_000);
        expect(result.current).toBe(13_000);

        releaseStale();
        await flush();

        expect(result.current).toBe(13_000);
    });

    it("stops syncing after unmount", async () => {
        const { unmount } = renderHook(() => useClockOffset());
        await flush();
        unmount();
        fetchTime.mockClear();

        await advance(60 * 60_000);
        act(() => setVisibility("visible"));

        expect(fetchTime).not.toHaveBeenCalled();
    });
});
