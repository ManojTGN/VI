import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

export const motionPreference = { reduced: false };

function createAnimation(): Animation {
    return { finished: Promise.resolve(), cancel: vi.fn() } as unknown as Animation;
}

beforeEach(() => {
    motionPreference.reduced = false;
    localStorage.clear();

    Element.prototype.animate = vi.fn(createAnimation);
    Element.prototype.getAnimations = vi.fn(() => []);

    window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion") && motionPreference.reduced,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new Error("offline"))),
    );

    Element.prototype.scrollIntoView = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

afterEach(() => {
    cleanup();
});
