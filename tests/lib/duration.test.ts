import { describe, expect, it } from "vitest";
import { describeDuration, splitDuration } from "@/lib/duration";

describe("splitDuration", () => {
    it("splits milliseconds into days, hours, minutes and seconds", () => {
        const milliseconds = ((26 * 24 + 4) * 3600 + 5 * 60 + 9) * 1000 + 999;

        expect(splitDuration(milliseconds)).toEqual({ days: 26, hours: 4, minutes: 5, seconds: 9 });
    });

    it("never goes below zero", () => {
        expect(splitDuration(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    });

    it("keeps counting days past 99", () => {
        expect(splitDuration(150 * 86400 * 1000).days).toBe(150);
    });
});

describe("describeDuration", () => {
    it("uses singular and plural units", () => {
        expect(describeDuration({ days: 1, hours: 2, minutes: 1, seconds: 30 })).toBe(
            "1 day, 2 hours, 1 minute",
        );
    });
});
