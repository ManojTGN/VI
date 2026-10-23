"use client";

import { useCallback, useRef, type PointerEvent } from "react";

export function usePointerTilt<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    const onPointerMove = useCallback((event: PointerEvent<T>) => {
        const element = ref.current;

        if (event.pointerType !== "mouse" || !element) {
            return;
        }

        const bounds = element.getBoundingClientRect();
        element.style.setProperty(
            "--tilt-x",
            String((event.clientX - bounds.left) / bounds.width - 0.5),
        );
        element.style.setProperty(
            "--tilt-y",
            String((event.clientY - bounds.top) / bounds.height - 0.5),
        );
    }, []);

    const onPointerLeave = useCallback(() => {
        ref.current?.style.setProperty("--tilt-x", "0");
        ref.current?.style.setProperty("--tilt-y", "0");
    }, []);

    return { ref, onPointerMove, onPointerLeave };
}
