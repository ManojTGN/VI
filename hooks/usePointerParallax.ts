"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export function usePointerParallax<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;

        if (!element || prefersReducedMotion()) {
            return;
        }

        let frameId = 0;
        let pointerX = 0;
        let pointerY = 0;

        const apply = () => {
            frameId = 0;
            element.style.setProperty("--pointer-x", pointerX.toFixed(3));
            element.style.setProperty("--pointer-y", pointerY.toFixed(3));
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") {
                return;
            }

            pointerX = event.clientX / window.innerWidth - 0.5;
            pointerY = event.clientY / window.innerHeight - 0.5;

            if (!frameId) {
                frameId = requestAnimationFrame(apply);
            }
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("pointermove", handlePointerMove);
        };
    }, []);

    return ref;
}
