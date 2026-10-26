import { afterEach, describe, expect, it, vi } from "vitest";
import {
    choosePipMode,
    copyDocumentStyles,
    detectPipSupport,
    drawCountdownFrame,
    mirrorMotionPreference,
} from "@/lib/pictureInPicture";

function recordingContext() {
    const texts: string[] = [];
    const context = {
        fillStyle: "",
        font: "",
        textAlign: "",
        textBaseline: "",
        fillRect: vi.fn(),
        fillText: vi.fn((text: string) => texts.push(text)),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    };

    return { context: context as unknown as CanvasRenderingContext2D, texts };
}

describe("choosePipMode", () => {
    it("prefers live Document Picture-in-Picture", () => {
        expect(choosePipMode({ documentPip: true, videoPip: true })).toBe("document");
    });

    it("falls back to video Picture-in-Picture", () => {
        expect(choosePipMode({ documentPip: false, videoPip: true })).toBe("video");
    });

    it("offers nothing when the browser supports neither", () => {
        expect(choosePipMode({ documentPip: false, videoPip: false })).toBeNull();
    });
});

describe("detectPipSupport", () => {
    afterEach(() => {
        delete window.documentPictureInPicture;
    });

    it("reports no support in a plain browser environment", () => {
        expect(detectPipSupport()).toEqual({ documentPip: false, videoPip: false });
    });

    it("detects Document Picture-in-Picture", () => {
        window.documentPictureInPicture = {
            requestWindow: vi.fn(),
        } as unknown as DocumentPictureInPicture;

        expect(detectPipSupport().documentPip).toBe(true);
    });
});

describe("copyDocumentStyles", () => {
    function fakeSource(sheets: unknown[]) {
        return {
            documentElement: { className: "font-a font-b", lang: "en", dataset: {} },
            styleSheets: sheets,
        } as unknown as Document;
    }

    it("links external stylesheets by absolute URL and inlines the rest", async () => {
        const target = document.implementation.createHTMLDocument("pip");
        const copied = copyDocumentStyles(
            fakeSource([
                { href: "https://www.manojtgn.me/VI/_next/static/app.css" },
                { href: null, cssRules: [{ cssText: ".tile { color: pink; }" }] },
            ]),
            target,
        );

        const link = target.head.querySelector("link")!;
        link.dispatchEvent(new Event("load"));
        await copied;

        expect(link.href).toBe("https://www.manojtgn.me/VI/_next/static/app.css");
        expect(target.head.querySelector("style")?.textContent).toBe(".tile { color: pink; }");
        expect(target.documentElement.className).toBe("font-a font-b");
        expect(target.documentElement.lang).toBe("en");
    });

    it("does not wait forever for a stylesheet that never loads", async () => {
        vi.useFakeTimers();
        const target = document.implementation.createHTMLDocument("pip");
        const copied = copyDocumentStyles(
            fakeSource([{ href: "https://example.com/slow.css" }]),
            target,
        );

        await vi.advanceTimersByTimeAsync(3000);

        await expect(copied).resolves.toBeUndefined();
        vi.useRealTimers();
    });

    it("skips stylesheets whose rules cannot be read", async () => {
        const target = document.implementation.createHTMLDocument("pip");
        const locked = {
            href: null,
            get cssRules(): CSSRuleList {
                throw new DOMException("blocked", "SecurityError");
            },
        };

        await copyDocumentStyles(fakeSource([locked]), target);

        expect(target.head.querySelector("style")).toBeNull();
    });
});

describe("drawCountdownFrame", () => {
    const frame = { width: 640, height: 280, fontFamily: "Rubik" };

    it("draws every digit and unit label", () => {
        const { context, texts } = recordingContext();

        drawCountdownFrame(context, { days: 23, hours: 4, minutes: 5, seconds: 9 }, frame);

        expect(texts).toEqual([
            "2",
            "3",
            "DAYS",
            "0",
            "4",
            "HOURS",
            "0",
            "5",
            "MIN",
            "0",
            "9",
            "SEC",
        ]);
    });

    it("spells OUT NOW once released", () => {
        const { context, texts } = recordingContext();

        drawCountdownFrame(context, null, frame);

        expect(texts.join("")).toBe("OUTNOW");
    });

    it("paints the whole background first", () => {
        const { context } = recordingContext();

        drawCountdownFrame(context, { days: 1, hours: 2, minutes: 3, seconds: 4 }, frame);

        expect(vi.mocked(context.fillRect).mock.calls[0]).toEqual([0, 0, 640, 280]);
    });
});

describe("mirrorMotionPreference", () => {
    it("copies the animations setting into the floating window", () => {
        const target = document.implementation.createHTMLDocument("pip");
        document.documentElement.dataset.motion = "reduced";

        mirrorMotionPreference(document, target);

        expect(target.documentElement.dataset.motion).toBe("reduced");
    });

    it("clears the setting when the page has none", () => {
        const target = document.implementation.createHTMLDocument("pip");
        target.documentElement.dataset.motion = "reduced";
        delete document.documentElement.dataset.motion;

        mirrorMotionPreference(document, target);

        expect(target.documentElement.dataset.motion).toBeUndefined();
    });
});
