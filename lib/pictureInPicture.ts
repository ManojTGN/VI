import type { Duration } from "./duration";

export type PipMode = "document" | "video";

type PipSupport = {
    documentPip: boolean;
    videoPip: boolean;
};

type FrameOptions = {
    width: number;
    height: number;
    fontFamily: string;
};

const UNIT_LABELS: [keyof Duration, string][] = [
    ["days", "DAYS"],
    ["hours", "HOURS"],
    ["minutes", "MIN"],
    ["seconds", "SEC"],
];

const COLORS = {
    background: "#05060c",
    tileTop: "#ff4fa8",
    tileMidTop: "#f2338f",
    tileMidBottom: "#d81f84",
    tileBottom: "#9a1675",
    hinge: "rgba(40, 0, 30, 0.5)",
    digit: "#ffffff",
    label: "#a08bb8",
};

export function choosePipMode({ documentPip, videoPip }: PipSupport): PipMode | null {
    if (documentPip) {
        return "document";
    }

    return videoPip ? "video" : null;
}

export function detectPipSupport(): PipSupport {
    return {
        documentPip: typeof window.documentPictureInPicture?.requestWindow === "function",
        videoPip:
            document.pictureInPictureEnabled === true &&
            typeof HTMLVideoElement.prototype.requestPictureInPicture === "function" &&
            typeof HTMLCanvasElement.prototype.captureStream === "function",
    };
}

const STYLE_LOAD_TIMEOUT_MS = 3000;

function linkStyleSheet(target: Document, href: string) {
    const link = target.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    target.head.append(link);

    return new Promise<void>((resolve) => {
        link.addEventListener("load", () => resolve(), { once: true });
        link.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, STYLE_LOAD_TIMEOUT_MS);
    });
}

function inlineStyleSheet(target: Document, sheet: CSSStyleSheet) {
    try {
        const style = target.createElement("style");
        style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
        target.head.append(style);
    } catch {
        return;
    }
}

export function mirrorMotionPreference(source: Document, target: Document) {
    const motion = source.documentElement.dataset.motion;

    if (motion) {
        target.documentElement.dataset.motion = motion;
    } else {
        delete target.documentElement.dataset.motion;
    }
}

export async function copyDocumentStyles(source: Document, target: Document) {
    target.documentElement.className = source.documentElement.className;
    target.documentElement.lang = source.documentElement.lang;
    mirrorMotionPreference(source, target);

    const loads = [...source.styleSheets].map((sheet) => {
        if (sheet.href) {
            return linkStyleSheet(target, sheet.href);
        }

        inlineStyleSheet(target, sheet);
        return Promise.resolve();
    });

    await Promise.all(loads);
}

function fillTileHalf(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    from: string,
    to: string,
) {
    const gradient = context.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);
}

function drawTile(
    context: CanvasRenderingContext2D,
    glyph: string,
    x: number,
    y: number,
    tileHeight: number,
    fontFamily: string,
) {
    const tileWidth = tileHeight * 0.72;
    const half = tileHeight / 2;

    fillTileHalf(context, x, y, tileWidth, half, COLORS.tileTop, COLORS.tileMidTop);
    fillTileHalf(context, x, y + half, tileWidth, half, COLORS.tileMidBottom, COLORS.tileBottom);

    context.fillStyle = COLORS.digit;
    context.font = `800 ${Math.round(tileHeight * 0.68)}px ${fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(glyph, x + tileWidth / 2, y + half + tileHeight * 0.03);

    context.fillStyle = COLORS.hinge;
    context.fillRect(x, y + half - 1, tileWidth, 2);

    return tileWidth;
}

export function drawCountdownFrame(
    context: CanvasRenderingContext2D,
    duration: Duration | null,
    { width, height, fontFamily }: FrameOptions,
) {
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, width, height);

    const groups: { glyphs: string[]; label: string }[] = duration
        ? UNIT_LABELS.map(([key, label]) => ({
              glyphs: String(duration[key]).padStart(2, "0").split(""),
              label,
          }))
        : [
              { glyphs: ["O", "U", "T"], label: "" },
              { glyphs: ["N", "O", "W"], label: "" },
          ];

    const tileHeight = height * 0.5;
    const tileGap = tileHeight * 0.05;
    const groupGap = tileHeight * 0.22;
    const tileWidth = tileHeight * 0.72;
    const groupWidths = groups.map(
        ({ glyphs }) => glyphs.length * tileWidth + (glyphs.length - 1) * tileGap,
    );
    const totalWidth =
        groupWidths.reduce((sum, value) => sum + value, 0) + groupGap * (groups.length - 1);
    const top = (height - tileHeight) / 2 - height * 0.05;
    let x = (width - totalWidth) / 2;

    groups.forEach(({ glyphs, label }, index) => {
        const groupStart = x;

        glyphs.forEach((glyph) => {
            x += drawTile(context, glyph, x, top, tileHeight, fontFamily) + tileGap;
        });

        if (label) {
            context.fillStyle = COLORS.label;
            context.font = `500 ${Math.round(tileHeight * 0.16)}px ${fontFamily}`;
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillText(
                label,
                groupStart + groupWidths[index] / 2,
                top + tileHeight + tileHeight * 0.14,
            );
        }

        x += groupGap - tileGap;
    });
}
