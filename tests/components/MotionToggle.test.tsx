import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MotionToggle } from "@/components/MotionToggle/MotionToggle";

describe("MotionToggle", () => {
    it("reads as pressed while animations are on", () => {
        render(<MotionToggle motion="full" onChange={vi.fn()} />);
        const toggle = screen.getByRole("button", { name: /turn animations off/i });

        expect(toggle).toHaveAttribute("aria-pressed", "true");
        expect(toggle).toHaveAttribute("title", "Animations on");
    });

    it("reads as unpressed while animations are off", () => {
        render(<MotionToggle motion="reduced" onChange={vi.fn()} />);
        const toggle = screen.getByRole("button", { name: /turn animations on/i });

        expect(toggle).toHaveAttribute("aria-pressed", "false");
        expect(toggle).toHaveAttribute("title", "Animations off");
    });

    it.each([
        ["full", "reduced"],
        ["reduced", "full"],
    ] as const)("switches %s to %s", (motion, expected) => {
        const onChange = vi.fn();
        render(<MotionToggle motion={motion} onChange={onChange} />);

        fireEvent.click(screen.getByRole("button"));

        expect(onChange).toHaveBeenCalledWith(expected);
    });
});
