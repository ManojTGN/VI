import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Brand } from "@/components/Brand/Brand";
import { OFFICIAL_SITE_URL } from "@/lib/release";

describe("Brand", () => {
    it("links to the official site in a new tab", () => {
        render(<Brand />);
        const link = screen.getByRole("link");

        expect(link).toHaveAttribute("href", OFFICIAL_SITE_URL);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("opens a new tab on a plain click", () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        render(<Brand />);

        const notPrevented = fireEvent.click(screen.getByRole("link"));

        expect(open).toHaveBeenCalledWith(OFFICIAL_SITE_URL, "_blank", "noopener,noreferrer");
        expect(notPrevented).toBe(false);
    });

    it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
        "leaves modified clicks to the browser (%o)",
        (modifier) => {
            const open = vi.spyOn(window, "open").mockReturnValue(null);
            render(<Brand />);

            fireEvent.click(screen.getByRole("link"), modifier);

            expect(open).not.toHaveBeenCalled();
        },
    );
});
