import { afterEach, describe, expect, it, vi } from "vitest";
import { measureClockOffset, readClockSample } from "@/lib/serverClock";

const SERVER_TIME = Date.UTC(2026, 9, 26, 7, 37, 32);

function sample(localSkew: number, overrides: Partial<Parameters<typeof readClockSample>[0]> = {}) {
    const requestStart = SERVER_TIME + localSkew - 100;

    return {
        serverTime: SERVER_TIME,
        requestStart,
        requestEnd: requestStart + 200,
        ...overrides,
    };
}

function timeResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
        ...init,
    });
}

describe("readClockSample", () => {
    it("measures how far the computer clock is from the server", () => {
        expect(readClockSample(sample(-5 * 60_000))).toEqual({
            offset: 5 * 60_000,
            roundTrip: 200,
        });
        expect(readClockSample(sample(2 * 86_400_000))?.offset).toBe(-2 * 86_400_000);
        expect(readClockSample(sample(0))?.offset).toBe(0);
    });

    it.each([
        ["a missing server time", { serverTime: Number.NaN }],
        ["a very slow request", { requestEnd: SERVER_TIME + 10_000 }],
        ["a clock that moved backwards mid-request", { requestEnd: SERVER_TIME - 60_000 }],
    ])("rejects %s", (_, overrides) => {
        expect(readClockSample(sample(-5 * 60_000, overrides))).toBeNull();
    });
});

describe("measureClockOffset", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("reads the uncached time endpoint", async () => {
        vi.useFakeTimers({ now: SERVER_TIME - 60_000 });
        const fetcher = vi.fn(async () => timeResponse({ now: SERVER_TIME }));

        const offset = await measureClockOffset("/VI/api/time", { samples: 1, fetcher });

        expect(fetcher).toHaveBeenCalledWith("/VI/api/time", {
            cache: "no-store",
            signal: undefined,
        });
        expect(offset).toBe(60_000);
    });

    it("keeps the sample with the fastest round trip", async () => {
        vi.useFakeTimers({ now: SERVER_TIME });
        const delays = [900, 40, 400];
        const fetcher = vi.fn(async () => {
            const delay = delays.shift()!;
            vi.advanceTimersByTime(delay);
            return timeResponse({ now: Date.now() - delay / 2 + 3000 });
        });

        const offset = await measureClockOffset("/VI/api/time", { samples: 3, fetcher });

        expect(fetcher).toHaveBeenCalledTimes(3);
        expect(offset).toBe(3000);
    });

    it("is not fooled by CDN cache headers on the response", async () => {
        vi.useFakeTimers({ now: SERVER_TIME });
        const fetcher = vi.fn(async () =>
            timeResponse(
                { now: SERVER_TIME },
                {
                    headers: {
                        "content-type": "application/json",
                        date: new Date(SERVER_TIME).toUTCString(),
                        age: "209742",
                    },
                },
            ),
        );

        expect(await measureClockOffset("/VI/api/time", { samples: 1, fetcher })).toBe(0);
    });

    it("uses any good sample when others fail", async () => {
        vi.useFakeTimers({ now: SERVER_TIME });
        const fetcher = vi
            .fn()
            .mockRejectedValueOnce(new TypeError("Failed to fetch"))
            .mockResolvedValueOnce(timeResponse({ now: SERVER_TIME + 7000 }))
            .mockResolvedValueOnce(timeResponse({ error: true }, { status: 500 }));

        expect(await measureClockOffset("/VI/api/time", { samples: 3, fetcher })).toBe(7000);
    });

    it.each([
        ["the request fails", () => Promise.reject(new TypeError("Failed to fetch"))],
        ["the server errors", async () => timeResponse({ error: true }, { status: 500 })],
        ["the body is not the expected shape", async () => timeResponse({ now: "soon" })],
        ["the body is not JSON", async () => new Response("<html>")],
    ])("reports no reading when %s", async (_, response) => {
        const fetcher = vi.fn(response) as unknown as typeof fetch;

        expect(await measureClockOffset("/VI/api/time", { samples: 2, fetcher })).toBeNull();
    });

    it("reports no reading once cancelled", async () => {
        const controller = new AbortController();
        const fetcher = vi.fn(async () => {
            controller.abort();
            return timeResponse({ now: SERVER_TIME });
        });

        const offset = await measureClockOffset("/VI/api/time", {
            samples: 3,
            fetcher,
            signal: controller.signal,
        });

        expect(offset).toBeNull();
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});
