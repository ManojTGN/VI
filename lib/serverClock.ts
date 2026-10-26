const MAX_ROUND_TRIP_MS = 5000;

type ClockSample = {
    serverTime: number;
    requestStart: number;
    requestEnd: number;
};

type ClockReading = {
    offset: number;
    roundTrip: number;
};

type MeasureOptions = {
    samples?: number;
    fetcher?: typeof fetch;
    signal?: AbortSignal;
};

export function readClockSample({
    serverTime,
    requestStart,
    requestEnd,
}: ClockSample): ClockReading | null {
    const roundTrip = requestEnd - requestStart;

    if (!Number.isFinite(serverTime) || roundTrip < 0 || roundTrip > MAX_ROUND_TRIP_MS) {
        return null;
    }

    return { offset: Math.round(serverTime - (requestStart + roundTrip / 2)), roundTrip };
}

async function sampleServerClock(url: string, fetcher: typeof fetch, signal?: AbortSignal) {
    const requestStart = Date.now();
    const response = await fetcher(url, { cache: "no-store", signal });
    const requestEnd = Date.now();

    if (!response.ok) {
        return null;
    }

    const { now } = (await response.json()) as { now?: unknown };

    return readClockSample({
        serverTime: typeof now === "number" ? now : Number.NaN,
        requestStart,
        requestEnd,
    });
}

export async function measureClockOffset(
    url: string,
    { samples = 3, fetcher = fetch, signal }: MeasureOptions = {},
) {
    let best: ClockReading | null = null;

    for (let attempt = 0; attempt < samples && !signal?.aborted; attempt++) {
        try {
            const reading = await sampleServerClock(url, fetcher, signal);

            if (reading && (!best || reading.roundTrip < best.roundTrip)) {
                best = reading;
            }
        } catch {
            if (signal?.aborted) {
                return null;
            }
        }
    }

    return signal?.aborted ? null : (best?.offset ?? null);
}
