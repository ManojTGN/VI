const MIN_CORRECTION_MS = 1500;
const MAX_ROUND_TRIP_MS = 5000;
const DATE_HEADER_RESOLUTION_MS = 1000;

type ClockSample = {
    dateHeader: string | null;
    ageHeader: string | null;
    requestStart: number;
    requestEnd: number;
};

export function estimateClockOffset({
    dateHeader,
    ageHeader,
    requestStart,
    requestEnd,
}: ClockSample) {
    const serverDate = Date.parse(dateHeader ?? "");
    const roundTrip = requestEnd - requestStart;

    if (Number.isNaN(serverDate) || roundTrip < 0 || roundTrip > MAX_ROUND_TRIP_MS) {
        return 0;
    }

    const ageSeconds = Math.max(0, Number(ageHeader) || 0);
    const serverNow = serverDate + DATE_HEADER_RESOLUTION_MS / 2 + ageSeconds * 1000;
    const localNow = requestStart + roundTrip / 2;
    const offset = Math.round(serverNow - localNow);

    return Math.abs(offset) < MIN_CORRECTION_MS ? 0 : offset;
}

export async function fetchClockOffset(url: string, fetcher: typeof fetch = fetch) {
    try {
        const requestStart = Date.now();
        const response = await fetcher(url, { method: "HEAD", cache: "no-store" });
        const requestEnd = Date.now();

        return estimateClockOffset({
            dateHeader: response.headers.get("date"),
            ageHeader: response.headers.get("age"),
            requestStart,
            requestEnd,
        });
    } catch {
        return 0;
    }
}
