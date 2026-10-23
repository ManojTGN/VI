import { describe, expect, it, vi } from "vitest";
import { launchConfetti } from "@/lib/confetti";
import { shake } from "@/lib/motion";
import { setMotionPreference } from "../setup";

function createCanvas() {
    const canvas = document.createElement("canvas");
    const context = {
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
    };

    vi.spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);

    return canvas;
}

describe("shake", () => {
    it("jolts the element", () => {
        const element = document.createElement("div");

        shake(element);

        expect(element.animate).toHaveBeenCalledOnce();
    });

    it("stays still when the visitor asks for reduced motion", () => {
        setMotionPreference("reduced");
        const element = document.createElement("div");

        shake(element);

        expect(element.animate).not.toHaveBeenCalled();
    });
});

describe("launchConfetti", () => {
    it("runs and cleans up after itself", () => {
        const addListener = vi.spyOn(window, "addEventListener");
        const removeListener = vi.spyOn(window, "removeEventListener");

        launchConfetti(createCanvas(), { count: 4 })();

        expect(addListener).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("launches nothing when the visitor asks for reduced motion", () => {
        setMotionPreference("reduced");
        const addListener = vi.spyOn(window, "addEventListener");

        const release = launchConfetti(createCanvas(), { count: 4 });

        expect(addListener).not.toHaveBeenCalledWith("resize", expect.any(Function));
        expect(release).toBeTypeOf("function");
    });

    it("draws nothing without a 2d context", () => {
        const canvas = document.createElement("canvas");

        expect(launchConfetti(canvas)).toBeTypeOf("function");
    });
});
