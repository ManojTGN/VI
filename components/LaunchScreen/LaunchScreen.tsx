"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Aurora } from "@/components/Aurora/Aurora";
import { Brand } from "@/components/Brand/Brand";
import { Confetti } from "@/components/Confetti/Confetti";
import { Countdown } from "@/components/Countdown/Countdown";
import { Disclaimer } from "@/components/Disclaimer/Disclaimer";
import type { LaunchControls } from "@/components/DevToolbar/LaunchDevTools";
import { MotionToggle } from "@/components/MotionToggle/MotionToggle";
import { TimezonePicker } from "@/components/TimezonePicker/TimezonePicker";
import { useClockOffset } from "@/hooks/useClockOffset";
import { useCountdown } from "@/hooks/useCountdown";
import { useFinaleStage } from "@/hooks/useFinaleStage";
import { useIdleTask } from "@/hooks/useIdleTask";
import { useMotion } from "@/hooks/useMotion";
import { useTimezone } from "@/hooks/useTimezone";
import { shake } from "@/lib/motion";
import { getAllTimezones, getReleaseInstant } from "@/lib/timezones";
import styles from "./LaunchScreen.module.css";

const LaunchDevTools =
    process.env.NODE_ENV === "development"
        ? dynamic(
              () =>
                  import("@/components/DevToolbar/LaunchDevTools").then(
                      (mod) => mod.LaunchDevTools,
                  ),
              { ssr: false },
          )
        : null;

export function LaunchScreen() {
    const stageRef = useRef<HTMLDivElement>(null);
    const { timezone, localTimezone, selectTimezone, clearTimezone } = useTimezone();
    const { motion, setMotion } = useMotion();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [targetOverride, setTargetOverride] = useState<number | null>(null);
    const [confettiBursts, setConfettiBursts] = useState(0);
    const [introKey, setIntroKey] = useState(0);

    const target = useMemo(
        () => targetOverride ?? (timezone ? getReleaseInstant(timezone) : null),
        [targetOverride, timezone],
    );
    const clockOffset = useClockOffset();
    const remaining = useCountdown(target, clockOffset);
    const stage = useFinaleStage(remaining, target);
    const isRevealed = stage === "revealed";

    useIdleTask(getAllTimezones);

    useEffect(() => {
        if (isRevealed && stageRef.current) {
            shake(stageRef.current);
        }
    }, [isRevealed]);

    const controls = useMemo<LaunchControls>(
        () => ({
            finishIn: (seconds) => setTargetOverride(Date.now() + clockOffset + seconds * 1000),
            resetToReleaseDate: () => setTargetOverride(null),
            fireConfetti: () => setConfettiBursts((count) => count + 1),
            shake: () => stageRef.current && shake(stageRef.current),
            replayIntro: () => setIntroKey((key) => key + 1),
            openTimezones: () => setIsPickerOpen(true),
            resetTimezone: clearTimezone,
            toggleMotion: () =>
                setMotion(
                    document.documentElement.dataset.motion === "reduced" ? "full" : "reduced",
                ),
        }),
        [clearTimezone, clockOffset, setMotion],
    );

    return (
        <main className={styles.screen}>
            <div ref={stageRef} className={styles.stage}>
                <Aurora />

                <div key={introKey} className={styles.content}>
                    <header className={styles.header}>
                        <Brand />
                        {timezone && localTimezone && (
                            <TimezonePicker
                                timezone={timezone}
                                localTimezone={localTimezone}
                                isOpen={isPickerOpen}
                                onOpenChange={setIsPickerOpen}
                                onSelect={selectTimezone}
                            />
                        )}
                        {motion && <MotionToggle motion={motion} onChange={setMotion} />}
                    </header>

                    <Countdown remaining={remaining} stage={stage} />
                </div>

                <Disclaimer />
            </div>

            {(isRevealed || confettiBursts > 0) && <Confetti key={`${target}-${confettiBursts}`} />}

            {LaunchDevTools && <LaunchDevTools controls={controls} />}
        </main>
    );
}
