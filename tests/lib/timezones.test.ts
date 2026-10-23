import { afterEach, describe, expect, it, vi } from "vitest";
import {
    abbreviateLabel,
    findTimezone,
    getAllTimezones,
    getLocalTimezone,
    getReleaseInstant,
    getTimezoneLabel,
    normalizeSearch,
    searchTimezones,
    toCanonicalTimezone,
} from "@/lib/timezones";

describe("getReleaseInstant", () => {
    it.each([
        ["UTC", Date.UTC(2026, 10, 19, 0, 0)],
        ["Asia/Kolkata", Date.UTC(2026, 10, 18, 18, 30)],
        ["Asia/Kathmandu", Date.UTC(2026, 10, 18, 18, 15)],
        ["America/New_York", Date.UTC(2026, 10, 19, 5, 0)],
        ["America/Santiago", Date.UTC(2026, 10, 19, 3, 0)],
        ["Australia/Lord_Howe", Date.UTC(2026, 10, 18, 13, 0)],
        ["Pacific/Kiritimati", Date.UTC(2026, 10, 18, 10, 0)],
    ])("is midnight on 19 November in %s", (timezone, expected) => {
        expect(getReleaseInstant(timezone)).toBe(expected);
    });
});

describe("toCanonicalTimezone", () => {
    it("normalises casing", () => {
        expect(toCanonicalTimezone("america/new_york")).toBe("America/New_York");
    });

    it.each([null, undefined, "", "Mars/Phobos", "not a zone"])("rejects %s", (value) => {
        expect(toCanonicalTimezone(value)).toBeNull();
    });
});

describe("getLocalTimezone", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("falls back to UTC when the browser reports no time zone", () => {
        const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementationOnce(function (
            this: Intl.DateTimeFormat,
        ) {
            return { ...resolvedOptions.call(this), timeZone: undefined as unknown as string };
        });

        expect(getLocalTimezone()).toBe("UTC");
    });

    it("always returns a zone the countdown can use", () => {
        const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementationOnce(function (
            this: Intl.DateTimeFormat,
        ) {
            return { ...resolvedOptions.call(this), timeZone: "Etc/Unknown" };
        });

        const timezone = getLocalTimezone();

        expect(() => getReleaseInstant(timezone)).not.toThrow();
    });
});

describe("getTimezoneLabel", () => {
    it.each([
        ["Asia/Kolkata", "India"],
        ["Asia/Tokyo", "Japan"],
        ["Europe/Berlin", "Central European"],
        ["America/New_York", "Eastern"],
        ["UTC", "UTC"],
        ["Etc/GMT+5", "GMT+5"],
    ])("labels %s as %s", (timezone, label) => {
        expect(getTimezoneLabel(timezone)).toBe(label);
    });
});

describe("abbreviateLabel", () => {
    it.each([
        ["India", "IND"],
        ["Japan", "JPN"],
        ["China", "CHN"],
        ["Central European", "CE"],
        ["Hawaii-Aleutian", "HA"],
        ["UTC", "UTC"],
        ["Gulf", "GLF"],
    ])("shortens %s to %s", (label, short) => {
        expect(abbreviateLabel(label)).toBe(short);
    });
});

describe("getAllTimezones", () => {
    it("lists every zone once, sorted by release time", () => {
        const timezones = getAllTimezones();
        const ids = timezones.map((timezone) => timezone.id);

        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain("UTC");
        timezones.slice(1).forEach((timezone, index) => {
            expect(timezone.releaseAt).toBeGreaterThanOrEqual(timezones[index].releaseAt);
        });
    });

    it("falls back to a curated list when Intl.supportedValuesOf is missing", async () => {
        const original = Intl.supportedValuesOf;
        vi.resetModules();
        Object.defineProperty(Intl, "supportedValuesOf", { value: undefined, configurable: true });

        try {
            const fresh = await import("@/lib/timezones");
            const ids = fresh.getAllTimezones().map((timezone) => timezone.id);

            expect(ids.length).toBeGreaterThan(20);
            expect(ids).toContain("UTC");
            expect(ids).toContain("Asia/Tokyo");
        } finally {
            Object.defineProperty(Intl, "supportedValuesOf", {
                value: original,
                configurable: true,
            });
        }
    });
});

describe("findTimezone", () => {
    it("describes zones that are not in the list", () => {
        expect(findTimezone("Etc/GMT+5").offsetLabel).toBe("UTC−05:00");
    });
});

describe("searchTimezones", () => {
    const timezones = getAllTimezones();
    const cities = (query: string) => searchTimezones(timezones, query).map((zone) => zone.city);

    it("matches cities, countries and offsets", () => {
        expect(cities("kolkata")).toContain("Kolkata");
        expect(cities("india")).toContain("Kolkata");
        expect(cities("+5:30")).toContain("Kolkata");
        expect(cities("utc+9")).toContain("Tokyo");
        expect(cities("new york")).toContain("New York");
    });

    it("returns everything for an empty query and nothing for nonsense", () => {
        expect(searchTimezones(timezones, "  ")).toHaveLength(timezones.length);
        expect(searchTimezones(timezones, "zzzz")).toHaveLength(0);
    });
});

describe("normalizeSearch", () => {
    it("ignores case, spaces, underscores, slashes and the minus sign variant", () => {
        expect(normalizeSearch("America/New_York UTC−05")).toBe("americanewyorkutc-05");
    });
});
