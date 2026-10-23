"use client";

import { useState } from "react";
import styles from "./Disclaimer.module.css";

export function Disclaimer() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <aside className={styles.disclaimer} aria-label="Notice">
            <p className={styles.text}>Unofficial fan site · Not affiliated with Rockstar Games</p>
            <button
                type="button"
                className={styles.close}
                aria-label="Hide notice"
                onClick={() => setIsVisible(false)}
            >
                <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M7 7l10 10M17 7L7 17" />
                </svg>
            </button>
        </aside>
    );
}
