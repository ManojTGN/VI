import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Countdown } from "@/components/Countdown/Countdown";

const TWENTY_SIX_DAYS = ((26 * 24 + 4) * 3600 + 5 * 60 + 9) * 1000;

describe("Countdown", () => {
    it("announces the remaining time to screen readers", () => {
        render(<Countdown remaining={TWENTY_SIX_DAYS} stage="counting" />);

        expect(screen.getByRole("timer")).toHaveTextContent(
            "26 days, 4 hours, 5 minutes until release",
        );
    });

    it("hides the split-flap digits from assistive technology", () => {
        const { container } = render(<Countdown remaining={TWENTY_SIX_DAYS} stage="counting" />);

        container
            .querySelectorAll("[class*='tiles']")
            .forEach((tiles) => expect(tiles).toHaveAttribute("aria-hidden", "true"));
    });

    it("says nothing before the time is known", () => {
        render(<Countdown remaining={null} stage="counting" />);

        expect(screen.getByRole("timer")).toBeEmptyDOMElement();
    });

    it("announces the release once revealed", () => {
        render(<Countdown remaining={0} stage="revealed" />);

        expect(screen.getByRole("status")).toHaveTextContent("Grand Theft Auto VI is out now");
    });
});
