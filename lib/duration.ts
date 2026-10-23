export type Duration = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

export function splitDuration(milliseconds: number): Duration {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

    return {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor(totalSeconds / 3600) % 24,
        minutes: Math.floor(totalSeconds / 60) % 60,
        seconds: totalSeconds % 60,
    };
}

function plural(count: number, unit: string) {
    return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function describeDuration({ days, hours, minutes }: Duration) {
    return [plural(days, "day"), plural(hours, "hour"), plural(minutes, "minute")].join(", ");
}
