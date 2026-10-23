"use client";

import clsx from "clsx";
import { memo } from "react";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import styles from "./Aurora.module.css";

export const Aurora = memo(function Aurora() {
    const ref = usePointerParallax<HTMLDivElement>();

    return (
        <div ref={ref} className={styles.aurora} aria-hidden>
            <span className={clsx(styles.glow, styles.pink)} />
            <span className={clsx(styles.glow, styles.cyan)} />
            <span className={clsx(styles.glow, styles.violet)} />
        </div>
    );
});
