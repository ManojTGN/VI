import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));

const { GET } = await import("@/app/api/time/route");
const { connection } = await import("next/server");

describe("GET /VI/api/time", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: Date.UTC(2026, 9, 26, 7, 37, 32, 456) });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns the server's current time in milliseconds", async () => {
        const response = await GET();

        expect(await response.json()).toEqual({ now: Date.UTC(2026, 9, 26, 7, 37, 32, 456) });
    });

    it("is rendered per request and never cached", async () => {
        const response = await GET();

        expect(connection).toHaveBeenCalled();
        expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
    });
});
