"use client";

import { memo } from "react";
import type { MotionPreference } from "@/lib/motion";
import styles from "./MotionToggle.module.css";

type MotionToggleProps = {
    motion: MotionPreference;
    onChange: (motion: MotionPreference) => void;
};

export const MotionToggle = memo(function MotionToggle({ motion, onChange }: MotionToggleProps) {
    const isFull = motion === "full";

    return (
        <button
            type="button"
            className={`${styles.toggle} reveal-icon rise-in`}
            aria-pressed={isFull}
            title={isFull ? "Animations on" : "Animations off"}
            aria-label={
                isFull ? "Animations on. Turn animations off" : "Animations off. Turn animations on"
            }
            onClick={() => onChange(isFull ? "reduced" : "full")}
        >
            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="2.6" />
                <path d="M6.6 7.6a7.5 7.5 0 0 0 0 8.8M17.4 7.6a7.5 7.5 0 0 1 0 8.8" />
                <path d="M3.2 4.4a12.5 12.5 0 0 0 0 15.2M20.8 4.4a12.5 12.5 0 0 1 0 15.2" />
                {!isFull && <path className={styles.slash} d="M4.5 19.5 19.5 4.5" />}
            </svg>
        </button>
    );
});
