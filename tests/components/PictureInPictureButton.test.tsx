import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PictureInPictureButton } from "@/components/PictureInPicture/PictureInPictureButton";

const TARGET = Date.UTC(2026, 10, 18, 18, 30);

function createPipWindow() {
    const pipDocument = document.implementation.createHTMLDocument("pip");
    const pipWindow = Object.assign(new EventTarget(), {
        document: pipDocument,
        setTimeout: window.setTimeout.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        close: vi.fn(() => pipWindow.dispatchEvent(new Event("pagehide"))),
    });

    return pipWindow as unknown as Window & { close: ReturnType<typeof vi.fn> };
}

async function flush() {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
    });
}

describe("PictureInPictureButton", () => {
    afterEach(() => {
        delete window.documentPictureInPicture;
    });

    it("renders nothing when the browser has no Picture-in-Picture support", () => {
        const { container } = render(
            <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    describe("with Document Picture-in-Picture", () => {
        let pipWindow: ReturnType<typeof createPipWindow>;
        let requestWindow: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            pipWindow = createPipWindow();
            requestWindow = vi.fn(async () => pipWindow);
            window.documentPictureInPicture = {
                requestWindow,
            } as unknown as DocumentPictureInPicture;
        });

        it("opens a floating window with a live countdown", async () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();

            expect(requestWindow).toHaveBeenCalledWith({ width: 460, height: 210 });
            await vi.waitFor(() =>
                expect(pipWindow.document.body.querySelector("[role=timer]")?.textContent).toMatch(
                    /until release$/,
                ),
            );
            expect(
                screen.getByRole("button", { name: "Close floating countdown" }),
            ).toHaveAttribute("aria-pressed", "true");
        });

        it("shows the logo on the left and the plain zone name on the right, without animations", async () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await vi.waitFor(() =>
                expect(pipWindow.document.body.querySelector("header")).not.toBeNull(),
            );

            const body = pipWindow.document.body;
            const [logo, zone] = [...body.querySelector("header")!.children];

            expect(logo.tagName.toLowerCase()).toBe("svg");
            expect(zone.textContent).toBe("India");
            expect(body.querySelector("button")).toBeNull();
            expect(body.querySelector(".rise-in")).toBeNull();
            expect(body.querySelector("[data-static='true']")).not.toBeNull();
        });

        it("follows the animations toggle while the floating window is open", async () => {
            document.documentElement.dataset.motion = "full";
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );
            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await vi.waitFor(() =>
                expect(pipWindow.document.documentElement.dataset.motion).toBe("full"),
            );

            document.documentElement.dataset.motion = "reduced";

            await vi.waitFor(() =>
                expect(pipWindow.document.documentElement.dataset.motion).toBe("reduced"),
            );
        });

        it("closes the window from the button", async () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );
            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();

            fireEvent.click(screen.getByRole("button", { name: "Close floating countdown" }));

            expect(pipWindow.close).toHaveBeenCalled();
            expect(screen.getByRole("button", { name: "Open floating countdown" })).toHaveAttribute(
                "aria-pressed",
                "false",
            );
        });

        it("resets when the floating window is closed directly", async () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );
            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();

            act(() => {
                pipWindow.dispatchEvent(new Event("pagehide"));
            });

            expect(
                screen.getByRole("button", { name: "Open floating countdown" }),
            ).toBeInTheDocument();
        });

        it("closes the floating window when the page goes away", async () => {
            const { unmount } = render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );
            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();

            unmount();

            expect(pipWindow.close).toHaveBeenCalled();
        });

        it("stays closed if the browser refuses to open the window", async () => {
            requestWindow.mockRejectedValueOnce(
                new DOMException("No user activation", "NotAllowedError"),
            );
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();

            expect(screen.getByRole("button", { name: "Open floating countdown" })).toHaveAttribute(
                "aria-pressed",
                "false",
            );
        });
    });

    describe("with the video fallback", () => {
        const originals = {
            enabled: Object.getOwnPropertyDescriptor(Document.prototype, "pictureInPictureEnabled"),
            request: HTMLVideoElement.prototype.requestPictureInPicture,
            capture: HTMLCanvasElement.prototype.captureStream,
            play: HTMLMediaElement.prototype.play,
            exit: document.exitPictureInPicture,
        };

        beforeEach(() => {
            Object.defineProperty(document, "pictureInPictureEnabled", {
                value: true,
                configurable: true,
            });
            HTMLCanvasElement.prototype.captureStream = vi.fn(() => ({}) as MediaStream);
            HTMLMediaElement.prototype.play = vi.fn(async () => undefined);
            HTMLVideoElement.prototype.requestPictureInPicture = vi.fn(async function (
                this: HTMLVideoElement,
            ) {
                this.dispatchEvent(new Event("enterpictureinpicture"));
                return {} as PictureInPictureWindow;
            });
            document.exitPictureInPicture = vi.fn(async () => {
                document.querySelector("video")?.dispatchEvent(new Event("leavepictureinpicture"));
            });
        });

        afterEach(() => {
            delete (document as { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled;
            if (originals.enabled) {
                Object.defineProperty(
                    Document.prototype,
                    "pictureInPictureEnabled",
                    originals.enabled,
                );
            }
            HTMLVideoElement.prototype.requestPictureInPicture = originals.request;
            HTMLCanvasElement.prototype.captureStream = originals.capture;
            HTMLMediaElement.prototype.play = originals.play;
            document.exitPictureInPicture = originals.exit;
        });

        it("prepares a hidden video so Picture-in-Picture opens straight from the click", () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            const video = document.querySelector("video")!;
            expect(video).not.toBeNull();
            expect(video.muted).toBe(true);
        });

        it("opens and closes video Picture-in-Picture", async () => {
            render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            fireEvent.click(screen.getByRole("button", { name: "Open floating countdown" }));
            await flush();
            expect(HTMLVideoElement.prototype.requestPictureInPicture).toHaveBeenCalled();
            expect(
                screen.getByRole("button", { name: "Close floating countdown" }),
            ).toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: "Close floating countdown" }));
            await flush();
            expect(document.exitPictureInPicture).toHaveBeenCalled();
            expect(
                screen.getByRole("button", { name: "Open floating countdown" }),
            ).toBeInTheDocument();
        });

        it("removes the hidden video when the page goes away", () => {
            const { unmount } = render(
                <PictureInPictureButton target={TARGET} clockOffset={0} timezoneLabel="India" />,
            );

            unmount();

            expect(document.querySelector("video")).toBeNull();
        });
    });
});
