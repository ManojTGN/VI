"use client";

import { useEffect, useRef, useState } from "react";

export type LabelFit = "full" | "short" | "icon";

export function measureLabelRoom(slot: HTMLElement) {
    const row = slot.parentElement;
    const first = row?.firstElementChild;

    if (!row || !first) {
        return slot.clientWidth;
    }

    const freeSpace = first.getBoundingClientRect().left - row.getBoundingClientRect().left;
    return slot.clientWidth + Math.max(0, freeSpace);
}

export function useLabelFit(label: string) {
    const slotRef = useRef<HTMLDivElement>(null);
    const fullRef = useRef<HTMLSpanElement>(null);
    const shortRef = useRef<HTMLSpanElement>(null);
    const [fit, setFit] = useState<LabelFit>("full");

    useEffect(() => {
        const slot = slotRef.current;
        const full = fullRef.current;
        const short = shortRef.current;

        if (!slot || !full || !short) {
            return;
        }

        const observer = new ResizeObserver(() => {
            const room = measureLabelRoom(slot);

            if (full.offsetWidth <= room) {
                setFit("full");
            } else if (short.offsetWidth <= room) {
                setFit("short");
            } else {
                setFit("icon");
            }
        });

        [slot, slot.parentElement, full, short].forEach(
            (element) => element && observer.observe(element),
        );
        return () => observer.disconnect();
    }, [label]);

    return { slotRef, fullRef, shortRef, fit };
}
