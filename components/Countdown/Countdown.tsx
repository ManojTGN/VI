"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import type { FinaleStage } from "@/hooks/useFinaleStage";
import { usePointerTilt } from "@/hooks/usePointerTilt";
import { describeDuration, splitDuration, type Duration } from "@/lib/duration";
import { FlipTile } from "./FlipTile";
import styles from "./Countdown.module.css";

type CountdownProps = {
    remaining: number | null;
    stage: FinaleStage;
    isStatic?: boolean;
};

const TIME_UNITS: { key: keyof Duration; label: string }[] = [
    { key: "days", label: "Days" },
    { key: "hours", label: "Hours" },
    { key: "minutes", label: "Min" },
    { key: "seconds", label: "Sec" },
];

const REVEAL_WORDS = ["OUT", "NOW", "!!!"];
const DIGITS_PER_UNIT = 2;

function riseDelay(seconds: number) {
    return { "--rise-delay": `${seconds}s` } as CSSProperties;
}

export function Countdown({ remaining, stage, isStatic = false }: CountdownProps) {
    const { ref: tiltRef, onPointerMove, onPointerLeave } = usePointerTilt<HTMLDivElement>();
    const entrance = isStatic ? styles.unitStatic : "rise-in";

    const isReady = remaining !== null;
    const isClearing = stage !== "counting";
    const isRevealed = stage === "revealed";
    const duration = splitDuration(remaining ?? 0);

    return (
        <div
            ref={isStatic ? undefined : tiltRef}
            className={styles.boards}
            data-stage={stage}
            data-static={isStatic}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerLeave={isStatic ? undefined : onPointerLeave}
        >
            <section
                className={clsx(styles.board, styles.countBoard)}
                aria-label="Time until release"
                aria-hidden={isRevealed}
            >
                <p className="sr-only" role="timer" aria-atomic="true">
                    {isReady ? `${describeDuration(duration)} until release` : ""}
                </p>
                {TIME_UNITS.map((unit, unitIndex) => {
                    const digits = String(duration[unit.key])
                        .padStart(DIGITS_PER_UNIT, "0")
                        .split("");

                    return (
                        <div
                            key={unit.key}
                            className={clsx(styles.unit, isReady && entrance)}
                            style={riseDelay(0.35 + unitIndex * 0.12)}
                        >
                            <div className={styles.tiles} aria-hidden>
                                {digits.map((digit, digitIndex) => {
                                    const tileIndex = unitIndex * DIGITS_PER_UNIT + digitIndex;

                                    return (
                                        <FlipTile
                                            key={digitIndex}
                                            glyph={isClearing ? "" : digit}
                                            delayIndex={isClearing ? tileIndex : 0}
                                            liftOnHover={!isStatic}
                                        />
                                    );
                                })}
                            </div>
                            <span className={styles.label} aria-hidden>
                                {unit.label}
                            </span>
                        </div>
                    );
                })}
            </section>

            {isRevealed && (
                <section className={clsx(styles.board, styles.revealBoard)} role="status">
                    <p className="sr-only">Grand Theft Auto VI is out now</p>
                    {REVEAL_WORDS.map((word, wordIndex) => (
                        <div
                            key={wordIndex}
                            className={clsx(styles.unit, styles.revealUnit, entrance)}
                            style={riseDelay(wordIndex * 0.1)}
                        >
                            <div className={clsx(styles.tiles, styles.revealTiles)} aria-hidden>
                                {[...word].map((letter, letterIndex) => {
                                    const tileIndex = wordIndex * word.length + letterIndex;

                                    return (
                                        <FlipTile
                                            key={letterIndex}
                                            glyph={letter}
                                            initialGlyph=""
                                            delayIndex={2 + tileIndex}
                                            liftOnHover={!isStatic}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
