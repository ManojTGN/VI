"use client";

import { useEffect, useState } from "react";

export type FinaleStage = "counting" | "clearing" | "revealed";

const CLEARING_DELAY = 600;
const REVEAL_DELAY = 1300;

export function useFinaleStage(remaining: number | null): FinaleStage {
    const [stage, setStage] = useState<FinaleStage>("counting");
    const isFinished = remaining === 0;

    if (!isFinished && stage !== "counting") {
        setStage("counting");
    }

    useEffect(() => {
        if (!isFinished) {
            return;
        }

        const timers = [
            window.setTimeout(() => setStage("clearing"), CLEARING_DELAY),
            window.setTimeout(() => setStage("revealed"), REVEAL_DELAY),
        ];

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [isFinished]);

    return isFinished ? stage : "counting";
}
