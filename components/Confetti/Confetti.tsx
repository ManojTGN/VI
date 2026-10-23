"use client";

import { useEffect, useRef } from "react";
import { launchConfetti } from "@/lib/confetti";
import styles from "./Confetti.module.css";

export function Confetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            return launchConfetti(canvasRef.current);
        }
    }, []);

    return <canvas ref={canvasRef} className={styles.canvas} aria-hidden />;
}
