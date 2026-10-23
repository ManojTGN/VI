import { RELEASE_DATE } from "./release";

export type Timezone = {
    id: string;
    city: string;
    region: string;
    name: string;
    offsetMinutes: number;
    offsetLabel: string;
    releaseAt: number;
    searchText: string;
};

const releaseWallClock = Date.UTC(RELEASE_DATE.year, RELEASE_DATE.month - 1, RELEASE_DATE.day);

const renamedCities: Record<string, string> = {
    Calcutta: "Kolkata",
    Saigon: "Ho Chi Minh",
    Katmandu: "Kathmandu",
    Rangoon: "Yangon",
    Kiev: "Kyiv",
    Godthab: "Nuuk",
    Faeroe: "Faroe",
    Ulan_Bator: "Ulaanbaatar",
    Truk: "Chuuk",
    Ponape: "Pohnpei",
    Enderbury: "Kanton",
};

const fallbackTimezoneIds = [
    "Pacific/Honolulu",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Atlantic/Azores",
    "Europe/London",
    "Europe/Paris",
    "Europe/Athens",
    "Europe/Moscow",
    "Africa/Lagos",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Perth",
    "Australia/Adelaide",
    "Australia/Sydney",
    "Pacific/Auckland",
];

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

let allTimezones: Timezone[] | null = null;

function getWallClockFormatter(timezone: string) {
    let formatter = wallClockFormatters.get(timezone);

    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        wallClockFormatters.set(timezone, formatter);
    }

    return formatter;
}

function getOffsetMinutes(timezone: string, instant: number) {
    const parts = getWallClockFormatter(timezone).formatToParts(instant);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);

    const wallClockAsUtc = Date.UTC(
        value("year"),
        value("month") - 1,
        value("day"),
        value("hour"),
        value("minute"),
        value("second"),
    );

    return Math.round((wallClockAsUtc - Math.floor(instant / 1000) * 1000) / 60000);
}

export function getReleaseInstant(timezone: string) {
    const estimate = releaseWallClock - getOffsetMinutes(timezone, releaseWallClock) * 60000;
    return releaseWallClock - getOffsetMinutes(timezone, estimate) * 60000;
}

export function toCanonicalTimezone(value: string | null | undefined) {
    if (!value) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat("en-US", { timeZone: value }).resolvedOptions().timeZone;
    } catch {
        return null;
    }
}

export function getLocalTimezone() {
    return toCanonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? "UTC";
}

function getTimezoneName(timezone: string, instant: number) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "long",
    }).formatToParts(instant);

    return parts.find((part) => part.type === "timeZoneName")?.value ?? timezone;
}

function getCityName(timezone: string) {
    const lastSegment = timezone.split("/").at(-1) ?? timezone;
    return (renamedCities[lastSegment] ?? lastSegment).replaceAll("_", " ");
}

export function getTimezoneLabel(timezone: string) {
    if (timezone === "UTC") {
        return "UTC";
    }

    const name = getTimezoneName(timezone, getReleaseInstant(timezone));

    if (name === "Coordinated Universal Time") {
        return "UTC";
    }

    if (/^GMT([+-]|$)/.test(name)) {
        return getCityName(timezone);
    }

    return (
        name.replace(/\s+(standard|daylight|summer|winter|mean)?\s*time$/i, "") ||
        getCityName(timezone)
    );
}

export function abbreviateLabel(label: string) {
    if (label.length <= 3) {
        return label.toUpperCase();
    }

    const words = label.split(/[\s-]+/).filter(Boolean);

    if (words.length > 1) {
        return words
            .slice(0, 3)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
    }

    const [first, ...rest] = label;
    const consonants = rest.filter((letter) => !/[aeiou]/i.test(letter));

    return (first + [...consonants, ...rest].slice(0, 2).join("")).toUpperCase();
}

export function normalizeSearch(value: string) {
    return value
        .toLowerCase()
        .replaceAll("−", "-")
        .replace(/[\s_/]+/g, "");
}

function formatOffset(offsetMinutes: number) {
    const sign = offsetMinutes < 0 ? "-" : "+";
    const absolute = Math.abs(offsetMinutes);
    const hours = Math.floor(absolute / 60);
    const minutes = String(absolute % 60).padStart(2, "0");

    return {
        label: `UTC${sign === "-" ? "−" : "+"}${String(hours).padStart(2, "0")}:${minutes}`,
        aliases: [`utc${sign}${hours}`, `${sign}${hours}:${minutes}`],
    };
}

function describeTimezone(id: string): Timezone {
    const releaseAt = getReleaseInstant(id);
    const offsetMinutes = getOffsetMinutes(id, releaseAt);
    const offset = formatOffset(offsetMinutes);
    const segments = id.split("/");
    const city = getCityName(id);
    const region = segments.length > 1 ? segments[0] : "Other";
    const name = getTimezoneName(id, releaseAt);

    return {
        id,
        city,
        region,
        name,
        offsetMinutes,
        offsetLabel: offset.label,
        releaseAt,
        searchText: normalizeSearch(
            [id, city, region, name, offset.label, ...offset.aliases].join(" "),
        ),
    };
}

function listTimezoneIds() {
    if (typeof Intl.supportedValuesOf === "function") {
        return Intl.supportedValuesOf("timeZone");
    }

    return fallbackTimezoneIds.map(toCanonicalTimezone).filter((id): id is string => id !== null);
}

export function getAllTimezones() {
    if (!allTimezones) {
        const ids = new Set(listTimezoneIds());
        ids.add("UTC");

        allTimezones = [...ids]
            .map(describeTimezone)
            .sort((a, b) => a.releaseAt - b.releaseAt || a.city.localeCompare(b.city));
    }

    return allTimezones;
}

export function findTimezone(id: string) {
    return getAllTimezones().find((timezone) => timezone.id === id) ?? describeTimezone(id);
}

export function searchTimezones(timezones: Timezone[], query: string) {
    const needle = normalizeSearch(query);
    return needle
        ? timezones.filter((timezone) => timezone.searchText.includes(needle))
        : timezones;
}
