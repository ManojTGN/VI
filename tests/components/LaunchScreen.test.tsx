import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LaunchScreen } from "@/components/LaunchScreen/LaunchScreen";
import { resetMotionCache } from "@/hooks/useMotion";
import { resetTimezoneCache, TIMEZONE_STORAGE_KEY } from "@/hooks/useTimezone";

const FOCUSABLE = "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])";

describe("LaunchScreen", () => {
    beforeEach(() => {
        resetTimezoneCache();
        resetMotionCache();
        vi.useFakeTimers({ now: Date.UTC(2026, 9, 23, 12, 0, 0) });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("counts down to midnight in the saved time zone", () => {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, "UTC");

        render(<LaunchScreen />);
        act(() => vi.advanceTimersByTime(0));

        expect(screen.getByRole("timer")).toHaveTextContent(
            "26 days, 12 hours, 0 minutes until release",
        );
        expect(screen.getByRole("button", { name: /time zone: utc/i })).toBeInTheDocument();
    });

    it("shows the logo without the Grand Theft Auto wordmark", () => {
        render(<LaunchScreen />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Grand Theft Auto VI");
        expect(screen.queryByText("Grand Theft Auto", { exact: true })).toBeNull();
    });

    it("tabs through the logo, the animations toggle, the time zone picker and the notice's close button, in order", () => {
        render(<LaunchScreen />);
        act(() => vi.advanceTimersToNextFrame());

        const focusable = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)];

        expect(focusable).toEqual([
            screen.getByRole("link", { name: /grand theft auto vi/i }),
            screen.getByRole("button", { name: /turn animations off/i }),
            screen.getByRole("button", { name: /change time zone/i }),
            screen.getByRole("button", { name: "Hide notice" }),
        ]);
    });

    it("adds the floating countdown button to the tab order when the browser supports it", () => {
        window.documentPictureInPicture = {
            requestWindow: vi.fn(),
        } as unknown as DocumentPictureInPicture;

        try {
            render(<LaunchScreen />);
            act(() => vi.advanceTimersToNextFrame());

            const focusable = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)];

            expect(focusable).toEqual([
                screen.getByRole("link", { name: /grand theft auto vi/i }),
                screen.getByRole("button", { name: /turn animations off/i }),
                screen.getByRole("button", { name: "Open floating countdown" }),
                screen.getByRole("button", { name: /change time zone/i }),
                screen.getByRole("button", { name: "Hide notice" }),
            ]);
        } finally {
            delete window.documentPictureInPicture;
        }
    });

    it("opens the picker from the keyboard and returns focus when it closes", () => {
        render(<LaunchScreen />);
        act(() => vi.advanceTimersToNextFrame());
        const trigger = screen.getByRole("button", { name: /change time zone/i });

        trigger.focus();
        fireEvent.click(trigger);
        act(() => vi.advanceTimersByTime(50));
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(document.activeElement).toBe(screen.getByRole("combobox"));

        fireEvent.keyDown(document.activeElement!, { key: "Escape" });
        act(() => vi.advanceTimersByTime(1000));
        expect(screen.queryByRole("dialog")).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it("shows the unofficial fan site notice until it is hidden for this visit", () => {
        const notice = "Unofficial fan site · Not affiliated with Rockstar Games";
        const { unmount } = render(<LaunchScreen />);

        expect(screen.getByText(notice)).toBeVisible();

        fireEvent.click(screen.getByRole("button", { name: "Hide notice" }));
        expect(screen.queryByText(notice)).toBeNull();

        unmount();
        render(<LaunchScreen />);
        expect(screen.getByText(notice)).toBeVisible();
    });

    it("keeps every control inside the picker reachable with Tab", () => {
        render(<LaunchScreen />);
        act(() => vi.advanceTimersToNextFrame());

        fireEvent.click(screen.getByRole("button", { name: /change time zone/i }));
        act(() => vi.advanceTimersByTime(50));

        const dialog = screen.getByRole("dialog");
        const tabbable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
        const highlighted = dialog.querySelector('[role="option"][tabindex="0"]');

        expect(tabbable).toEqual([
            screen.getByRole("button", { name: "Close" }),
            screen.getByRole("combobox"),
            highlighted,
        ]);
    });

    it("does not render developer tools outside development", () => {
        render(<LaunchScreen />);

        expect(screen.queryByRole("complementary", { name: /developer tools/i })).toBeNull();
    });

    it("reveals the release once the target has passed", () => {
        vi.setSystemTime(Date.UTC(2026, 10, 20));
        localStorage.setItem(TIMEZONE_STORAGE_KEY, "UTC");

        render(<LaunchScreen />);
        act(() => vi.advanceTimersToNextFrame());
        act(() => vi.advanceTimersByTime(2000));

        expect(screen.getByRole("status")).toHaveTextContent("Grand Theft Auto VI is out now");
    });

    describe("after the release", () => {
        function switchTimezone(timezone: string) {
            localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
            act(() => {
                window.dispatchEvent(new StorageEvent("storage", { key: TIMEZONE_STORAGE_KEY }));
            });
            act(() => vi.advanceTimersToNextFrame());
        }

        function renderReleased(timezone: string) {
            vi.setSystemTime(Date.UTC(2026, 10, 19, 5, 0, 0));
            localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
            render(<LaunchScreen />);
            act(() => vi.advanceTimersToNextFrame());
            act(() => vi.advanceTimersByTime(2000));
        }

        it("hides the animations toggle once everything has played", () => {
            renderReleased("UTC");

            expect(screen.getByRole("status")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /animations/i })).toBeNull();
        });

        it("counts down again in a time zone that has not reached midnight yet", () => {
            renderReleased("UTC");

            switchTimezone("America/Los_Angeles");

            expect(screen.queryByRole("status")).toBeNull();
            expect(screen.getByRole("timer")).toHaveTextContent(
                "0 days, 2 hours, 59 minutes until release",
            );
            expect(
                screen.getByRole("button", { name: /turn animations off/i }),
            ).toBeInTheDocument();
        });

        it("reveals again when switching back to a released time zone", () => {
            renderReleased("UTC");
            switchTimezone("America/Los_Angeles");

            switchTimezone("Asia/Kolkata");
            act(() => vi.advanceTimersByTime(1300));

            expect(screen.getByRole("status")).toHaveTextContent("Grand Theft Auto VI is out now");
            expect(screen.queryByRole("button", { name: /animations/i })).toBeNull();
        });

        it("keeps the release on screen when moving between released time zones", () => {
            renderReleased("UTC");

            switchTimezone("Asia/Kolkata");

            expect(screen.getByRole("status")).toHaveTextContent("Grand Theft Auto VI is out now");
            expect(screen.getByRole("button", { name: /time zone: india/i })).toBeInTheDocument();
        });
    });
});
