"use client";

import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { splitDuration } from "@/lib/duration";
import {
    choosePipMode,
    copyDocumentStyles,
    detectPipSupport,
    mirrorMotionPreference,
    drawCountdownFrame,
    type PipMode,
} from "@/lib/pictureInPicture";
import { PipCountdown } from "./PipCountdown";
import styles from "./PictureInPicture.module.css";

type PictureInPictureButtonProps = {
    target: number | null;
    clockOffset: number;
    timezoneLabel: string | null;
};

const PIP_WINDOW_SIZE = { width: 460, height: 210 };
const VIDEO_FRAME = { width: 640, height: 280 };
const VIDEO_REFRESH_MS = 250;

function subscribeNever() {
    return () => {};
}

function readPipMode() {
    return choosePipMode(detectPipSupport());
}

function readNothing(): PipMode | null {
    return null;
}

function PipIcon() {
    return (
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <rect x="12" y="11" width="7" height="6" rx="0.5" className={styles.iconInset} />
        </svg>
    );
}

export const PictureInPictureButton = memo(function PictureInPictureButton({
    target,
    clockOffset,
    timezoneLabel,
}: PictureInPictureButtonProps) {
    const mode = useSyncExternalStore(subscribeNever, readPipMode, readNothing);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const timingRef = useRef({ target, clockOffset });

    useEffect(() => {
        timingRef.current = { target, clockOffset };
    }, [target, clockOffset]);

    useEffect(() => () => pipWindow?.close(), [pipWindow]);

    useEffect(() => {
        if (!pipWindow) {
            return;
        }

        const observer = new MutationObserver(() =>
            mirrorMotionPreference(document, pipWindow.document),
        );
        observer.observe(document.documentElement, { attributeFilter: ["data-motion"] });

        return () => observer.disconnect();
    }, [pipWindow]);

    useEffect(() => {
        if (mode !== "video") {
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = VIDEO_FRAME.width;
        canvas.height = VIDEO_FRAME.height;
        const context = canvas.getContext("2d");
        const video = document.createElement("video");
        video.className = styles.hiddenVideo;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = canvas.captureStream();
        document.body.append(video);
        videoRef.current = video;

        const fontFamily =
            getComputedStyle(document.documentElement).getPropertyValue("--font-digit").trim() ||
            "sans-serif";
        let shownSecond: number | null = null;

        const render = () => {
            const { target: end, clockOffset: offset } = timingRef.current;
            const remaining = end === null ? null : Math.max(0, end - (Date.now() + offset));
            const second = remaining === null ? -1 : Math.floor(remaining / 1000);

            if (context && second !== shownSecond) {
                shownSecond = second;
                drawCountdownFrame(
                    context,
                    remaining === 0 ? null : splitDuration(remaining ?? 0),
                    { ...VIDEO_FRAME, fontFamily },
                );
            }
        };

        const handleLeave = () => setIsVideoActive(false);
        const handleEnter = () => setIsVideoActive(true);

        render();
        const intervalId = window.setInterval(render, VIDEO_REFRESH_MS);
        video.addEventListener("enterpictureinpicture", handleEnter);
        video.addEventListener("leavepictureinpicture", handleLeave);
        void Promise.resolve()
            .then(() => video.play())
            .catch(() => undefined);

        return () => {
            window.clearInterval(intervalId);
            video.removeEventListener("enterpictureinpicture", handleEnter);
            video.removeEventListener("leavepictureinpicture", handleLeave);
            if (document.pictureInPictureElement === video) {
                void document.exitPictureInPicture().catch(() => undefined);
            }
            video.remove();
            videoRef.current = null;
        };
    }, [mode]);

    if (!mode) {
        return null;
    }

    const isActive = pipWindow !== null || isVideoActive;

    const openDocumentPip = async () => {
        const requested = window.documentPictureInPicture?.requestWindow(PIP_WINDOW_SIZE);

        if (!requested) {
            return;
        }

        try {
            const opened = await requested;
            await copyDocumentStyles(document, opened.document);
            opened.addEventListener("pagehide", () => setPipWindow(null), { once: true });
            setPipWindow(opened);
        } catch {
            setPipWindow(null);
        }
    };

    const openVideoPip = () => {
        videoRef.current?.requestPictureInPicture().catch(() => setIsVideoActive(false));
    };

    const toggle = () => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        } else if (isVideoActive) {
            void document.exitPictureInPicture().catch(() => undefined);
        } else if (mode === "document") {
            void openDocumentPip();
        } else {
            openVideoPip();
        }
    };

    const label = isActive ? "Close floating countdown" : "Open floating countdown";

    return (
        <>
            <button
                type="button"
                className={`${styles.button} reveal-icon rise-in`}
                aria-label={label}
                aria-pressed={isActive}
                title={label}
                onClick={toggle}
            >
                <PipIcon />
            </button>
            {pipWindow &&
                createPortal(
                    <PipCountdown
                        target={target}
                        clockOffset={clockOffset}
                        timezoneLabel={timezoneLabel}
                        host={pipWindow}
                    />,
                    pipWindow.document.body,
                )}
        </>
    );
});
