"use client";

import { DevToolbar, type DevActionGroup } from "./DevToolbar";

export type LaunchControls = {
    finishIn: (seconds: number) => void;
    resetToReleaseDate: () => void;
    fireConfetti: () => void;
    shake: () => void;
    replayIntro: () => void;
    openTimezones: () => void;
    resetTimezone: () => void;
    toggleMotion: () => void;
};

type LaunchDevToolsProps = {
    controls: LaunchControls;
};

export function LaunchDevTools({ controls }: LaunchDevToolsProps) {
    const groups: DevActionGroup[] = [
        {
            title: "Countdown",
            actions: [
                { label: "Finish now", run: () => controls.finishIn(0) },
                { label: "Finish in 5s", run: () => controls.finishIn(5) },
                { label: "Finish in 1 min", run: () => controls.finishIn(60) },
                { label: "1 hour left", run: () => controls.finishIn(3600) },
                { label: "Release date", run: controls.resetToReleaseDate },
            ],
        },
        {
            title: "Effects",
            actions: [
                { label: "Confetti", run: controls.fireConfetti },
                { label: "Shake", run: controls.shake },
                {
                    label: "Confetti + shake",
                    run: () => {
                        controls.fireConfetti();
                        controls.shake();
                    },
                },
                { label: "Replay intro", run: controls.replayIntro },
            ],
        },
        {
            title: "Motion",
            actions: [{ label: "Toggle animations", run: controls.toggleMotion }],
        },
        {
            title: "Time zone",
            actions: [
                { label: "Open picker", run: controls.openTimezones },
                { label: "Reset to local", run: controls.resetTimezone },
            ],
        },
    ];

    return <DevToolbar groups={groups} />;
}
