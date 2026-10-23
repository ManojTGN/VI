import { describe, expect, it, vi } from "vitest";
import { estimateClockOffset, fetchClockOffset } from "@/lib/serverClock";

const SERVER_TIME = Date.UTC(2026, 9, 23, 12, 0, 0);

function sample(
    localSkew: number,
    overrides: Partial<Parameters<typeof estimateClockOffset>[0]> = {},
) {
    const requestStart = SERVER_TIME + localSkew - 100;

    return {
        dateHeader: new Date(SERVER_TIME).toUTCString(),
        ageHeader: null,
        requestStart,
        requestEnd: requestStart + 200,
        ...overrides,
    };
}

describe("estimateClockOffset", () => {
    it("corrects a computer clock that is five minutes behind", () => {
        const offset = estimateClockOffset(sample(-5 * 60_000));

        expect(Math.abs(offset - 5 * 60_000)).toBeLessThanOrEqual(1000);
    });

    it("corrects a computer clock that is a day ahead", () => {
        const offset = estimateClockOffset(sample(86_400_000));

        expect(Math.abs(offset + 86_400_000)).toBeLessThanOrEqual(1000);
    });

    it("leaves an accurate clock alone despite the header's one-second resolution", () => {
        expect(estimateClockOffset(sample(0))).toBe(0);
        expect(estimateClockOffset(sample(900))).toBe(0);
    });

    it("accounts for responses served from a CDN cache", () => {
        const cachedDate = new Date(SERVER_TIME - 120_000).toUTCString();

        expect(estimateClockOffset(sample(0, { dateHeader: cachedDate, ageHeader: "120" }))).toBe(
            0,
        );
    });

    it.each([
        ["a missing date header", { dateHeader: null }],
        ["an unreadable date header", { dateHeader: "yesterday-ish" }],
        ["a very slow request", { requestEnd: SERVER_TIME + 10_000 }],
        ["a clock that moved backwards mid-request", { requestEnd: SERVER_TIME - 60_000 }],
    ])("ignores %s", (_, overrides) => {
        expect(estimateClockOffset(sample(-5 * 60_000, overrides))).toBe(0);
    });
});

describe("fetchClockOffset", () => {
    it("asks the server for the time without using the cache", async () => {
        vi.setSystemTime(SERVER_TIME - 60_000);
        const fetcher = vi.fn(
            async () =>
                new Response(null, { headers: { date: new Date(SERVER_TIME).toUTCString() } }),
        );

        const offset = await fetchClockOffset("https://manojtgn.me/VI", fetcher);

        expect(fetcher).toHaveBeenCalledWith("https://manojtgn.me/VI", {
            method: "HEAD",
            cache: "no-store",
        });
        expect(Math.abs(offset - 60_000)).toBeLessThanOrEqual(1000);
        vi.useRealTimers();
    });

    it("falls back to the local clock when offline", async () => {
        const fetcher = vi.fn(() => Promise.reject(new TypeError("Failed to fetch")));

        expect(await fetchClockOffset("/VI", fetcher)).toBe(0);
    });
});
