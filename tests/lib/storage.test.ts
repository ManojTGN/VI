import { describe, expect, it, vi } from "vitest";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";

describe("storage", () => {
    it("reads, writes and removes values", () => {
        expect(writeStorage("key", "value")).toBe(true);
        expect(readStorage("key")).toBe("value");
        expect(removeStorage("key")).toBe(true);
        expect(readStorage("key")).toBeNull();
    });

    it("survives blocked storage", () => {
        const blocked = () => {
            throw new DOMException("blocked", "SecurityError");
        };
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
        vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);

        expect(readStorage("key")).toBeNull();
        expect(writeStorage("key", "value")).toBe(false);
        expect(removeStorage("key")).toBe(false);
    });
});
