export type MotionPreference = "full" | "reduced";

export const MOTION_STORAGE_KEY = "gta6-motion";

/** The site animates by default, regardless of the operating system's setting. */
export const DEFAULT_MOTION: MotionPreference = "full";

export function parseMotionPreference(value: string | null | undefined) {
    return value === "full" || value === "reduced" ? value : null;
}

/**
 * `data-motion` on <html> is the single runtime source of truth: the inline
 * script in app/layout.tsx sets it before first paint, every reduced-motion
 * CSS rule keys off it, and the guards below read it. That keeps the CSS and
 * the JavaScript effects from ever disagreeing.
 */
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
