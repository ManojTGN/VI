import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/site";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDevelopment ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
    basePath: BASE_PATH,
    cacheComponents: true,
    partialPrefetching: true,
    poweredByHeader: false,
    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },
    async redirects() {
        return [{ source: "/", destination: BASE_PATH, basePath: false, permanent: false }];
    },
};

export default nextConfig;
