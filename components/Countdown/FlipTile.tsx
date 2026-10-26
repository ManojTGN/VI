"use client";

import clsx from "clsx";
import { useState, type CSSProperties } from "react";
import styles from "./FlipTile.module.css";

const STAGGER_MS = 60;

type FlipTileProps = {
    glyph: string;
    initialGlyph?: string;
    delayIndex?: number;
    liftOnHover?: boolean;
};

type FlipState = {
    current: string;
    previous: string;
    flips: number;
    delayIndex: number;
};

type TileHalfProps = {
    side: "top" | "bottom";
    glyph: string;
    className?: string;
};

function TileHalf({ side, glyph, className }: TileHalfProps) {
    return (
        <span className={clsx(styles.half, styles[side], className)}>
            <span className={styles.glyph}>{glyph}</span>
        </span>
    );
}

export function FlipTile({
    glyph,
    initialGlyph,
    delayIndex = 0,
    liftOnHover = true,
}: FlipTileProps) {
    const [state, setState] = useState<FlipState>(() => ({
        current: initialGlyph ?? glyph,
        previous: initialGlyph ?? glyph,
        flips: 0,
        delayIndex: 0,
    }));

    if (glyph !== state.current) {
        setState({
            current: glyph,
            previous: state.current,
            flips: state.flips + 1,
            delayIndex,
        });
    }

    const style = { "--flip-delay": `${state.delayIndex * STAGGER_MS}ms` } as CSSProperties;

    return (
        <span className={clsx(styles.tile, liftOnHover && styles.liftable)} style={style}>
            <TileHalf side="top" glyph={state.current} />
            <TileHalf side="bottom" glyph={state.previous} />
            {state.flips > 0 && (
                <span key={state.flips} className={styles.flap}>
                    <TileHalf side="top" glyph={state.previous} className={styles.front} />
                    <TileHalf side="bottom" glyph={state.current} className={styles.back} />
                </span>
            )}
        </span>
    );
}
