"use client";

import { useEffect, useState } from "react";

export type FinaleStage = "counting" | "clearing" | "revealed";

const CLEARING_DELAY = 600;
const REVEAL_DELAY = 1300;

export function useFinaleStage(remaining: number | null, target: number | null): FinaleStage {
    const [progress, setProgress] = useState<{ target: number | null; stage: FinaleStage }>({
        target: null,
        stage: "counting",
    });
    const isFinished = remaining === 0;

    useEffect(() => {
        if (!isFinished) {
            return;
        }

        const timers = [
            window.setTimeout(() => setProgress({ target, stage: "clearing" }), CLEARING_DELAY),
            window.setTimeout(() => setProgress({ target, stage: "revealed" }), REVEAL_DELAY),
        ];

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [isFinished, target]);

    return isFinished && progress.target === target ? progress.stage : "counting";
}
