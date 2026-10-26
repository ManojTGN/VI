"use client";

import { ViLogo } from "@/components/Brand/ViLogo";
import { Countdown } from "@/components/Countdown/Countdown";
import { useCountdown } from "@/hooks/useCountdown";
import { useFinaleStage } from "@/hooks/useFinaleStage";
import styles from "./PictureInPicture.module.css";

type PipCountdownProps = {
    target: number | null;
    clockOffset: number;
    timezoneLabel: string | null;
    host: Window;
};

export function PipCountdown({ target, clockOffset, timezoneLabel, host }: PipCountdownProps) {
    const remaining = useCountdown(target, clockOffset, host);
    const stage = useFinaleStage(remaining);

    return (
        <main className={styles.pip}>
            <div className={styles.pipContent}>
                <header className={styles.pipHeader}>
                    <ViLogo className={styles.pipLogo} />
                    {timezoneLabel && <span className={styles.pipZone}>{timezoneLabel}</span>}
                </header>
                <Countdown remaining={remaining} stage={stage} isStatic />
            </div>
        </main>
    );
}
