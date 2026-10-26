import { describe, expect, it } from "vitest";
import { measureLabelRoom } from "@/hooks/useLabelFit";

function placeAt(element: Element, left: number) {
    element.getBoundingClientRect = () => ({ left }) as DOMRect;
}

function buildRow(slotWidth: number, rowLeft: number, firstLeft: number) {
    const row = document.createElement("div");
    const icon = document.createElement("button");
    const slot = document.createElement("div");
    row.append(icon, slot);
    Object.defineProperty(slot, "clientWidth", { value: slotWidth });
    placeAt(row, rowLeft);
    placeAt(icon, firstLeft);
    return slot;
}

describe("measureLabelRoom", () => {
    it("counts the free space left of the icons as room for the label", () => {
        expect(measureLabelRoom(buildRow(60, 100, 340))).toBe(300);
    });

    it("uses only the slot when the row is already full", () => {
        expect(measureLabelRoom(buildRow(45, 100, 100))).toBe(45);
    });

    it("falls back to the slot width when it has no row", () => {
        const slot = document.createElement("div");
        Object.defineProperty(slot, "clientWidth", { value: 80 });

        expect(measureLabelRoom(slot)).toBe(80);
    });
});
