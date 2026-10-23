import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { BASE_PATH } from "@/lib/site";

describe("next.config", () => {
    it("serves the app under /VI", () => {
        expect(nextConfig.basePath).toBe(BASE_PATH);
        expect(BASE_PATH).toBe("/VI");
    });

    it("never redirects a path onto itself", async () => {
        const redirects = (await nextConfig.redirects?.()) ?? [];
        const resolve = (path: string, usesBasePath: boolean) =>
            (usesBasePath ? `${BASE_PATH}${path}` : path).toLowerCase().replace(/\/$/, "");

        redirects.forEach((redirect) => {
            const usesBasePath = redirect.basePath !== false;

            expect(resolve(redirect.source, usesBasePath)).not.toBe(
                resolve(redirect.destination, usesBasePath),
            );
            expect(resolve(BASE_PATH, false)).not.toBe(resolve(redirect.source, usesBasePath));
        });
    });

    it("sends security headers on every route", async () => {
        const [rule] = (await nextConfig.headers?.()) ?? [];
        const keys = rule.headers.map((header) => header.key);

        expect(rule.source).toBe("/:path*");
        expect(keys).toEqual(
            expect.arrayContaining([
                "Content-Security-Policy",
                "X-Content-Type-Options",
                "X-Frame-Options",
                "Referrer-Policy",
                "Permissions-Policy",
            ]),
        );
        expect(nextConfig.poweredByHeader).toBe(false);
    });
});
