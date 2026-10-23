import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

/** Drives the same <html data-motion> attribute the app reads at runtime. */
export function setMotionPreference(preference: "full" | "reduced") {
    document.documentElement.dataset.motion = preference;
}

function createAnimation(): Animation {
    return { finished: Promise.resolve(), cancel: vi.fn() } as unknown as Animation;
}

beforeEach(() => {
    setMotionPreference("full");
    localStorage.clear();

    Element.prototype.animate = vi.fn(createAnimation);
    Element.prototype.getAnimations = vi.fn(() => []);

    window.matchMedia = vi.fn((query: string) => ({
        matches: false,
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
