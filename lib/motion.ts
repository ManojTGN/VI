export type MotionPreference = "full" | "reduced";

export const MOTION_STORAGE_KEY = "gta6-motion";

export const DEFAULT_MOTION: MotionPreference = "full";

export function parseMotionPreference(value: string | null | undefined) {
    return value === "full" || value === "reduced" ? value : null;
}

export function applyMotionPreference(preference: MotionPreference) {
    document.documentElement.dataset.motion = preference;
}

export function readMotionPreference(): MotionPreference {
    return parseMotionPreference(document.documentElement.dataset.motion) ?? DEFAULT_MOTION;
}

export function prefersReducedMotion() {
    return readMotionPreference() === "reduced";
}

export function shake(element: HTMLElement, { strength = 12, duration = 700 } = {}) {
    if (prefersReducedMotion()) {
        return;
    }

    const steps = 12;
    const frames: Keyframe[] = [];

    for (let step = 0; step < steps; step++) {
        const falloff = 1 - step / steps;
        const x = (Math.random() * 2 - 1) * strength * falloff;
        const y = (Math.random() * 2 - 1) * strength * 0.6 * falloff;
        const angle = (Math.random() * 2 - 1) * 0.6 * falloff;
        frames.push({ transform: `translate(${x}px, ${y}px) rotate(${angle}deg)` });
    }

    frames.push({ transform: "none" });
    element.animate(frames, { duration, easing: "ease-out" });
}
