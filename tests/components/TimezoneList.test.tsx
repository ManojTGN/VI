import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { TimezoneList } from "@/components/TimezonePicker/TimezoneList";
import { getAllTimezones } from "@/lib/timezones";

function renderList(selectedTimezone = "Asia/Tokyo") {
    const onSelect = vi.fn();
    render(
        <TimezoneList
            searchRef={createRef<HTMLInputElement>()}
            selectedTimezone={selectedTimezone}
            localTimezone="UTC"
            onSelect={onSelect}
        />,
    );

    const search = screen.getByRole("combobox");
    const highlighted = () =>
        document.getElementById(search.getAttribute("aria-activedescendant")!);

    return { onSelect, search, highlighted };
}

describe("TimezoneList", () => {
    it("pins the local zone first and highlights the current selection", () => {
        const { highlighted } = renderList();
        const options = screen.getAllByRole("option");

        expect(options[0]).toHaveTextContent("UTC");
        expect(highlighted()).toHaveTextContent("Tokyo");
        expect(highlighted()).toHaveAttribute("aria-selected", "true");
    });

    it("picks the first search result on Enter, not the pinned zone", () => {
        const { onSelect, search } = renderList();

        fireEvent.change(search, { target: { value: "london" } });
        fireEvent.keyDown(search, { key: "Enter" });

        expect(onSelect).toHaveBeenCalledWith("Europe/London");
    });

    it("moves the highlight with the keyboard", () => {
        const { search, highlighted } = renderList("UTC");
        const options = screen.getAllByRole("option");

        fireEvent.keyDown(search, { key: "ArrowDown" });
        expect(highlighted()).toBe(options[1]);

        fireEvent.keyDown(search, { key: "End", ctrlKey: true });
        expect(highlighted()).toBe(options.at(-1));

        fireEvent.keyDown(search, { key: "ArrowDown" });
        expect(highlighted()).toBe(options.at(-1));

        fireEvent.keyDown(search, { key: "Home", ctrlKey: true });
        fireEvent.keyDown(search, { key: "ArrowUp" });
        expect(highlighted()).toBe(options[0]);
    });

    it("ignores Enter while an input method is composing", () => {
        const { onSelect, search } = renderList();

        fireEvent.keyDown(search, { key: "Enter", isComposing: true });

        expect(onSelect).not.toHaveBeenCalled();
    });

    it("returns to the selected zone when the search is cleared", () => {
        const { search, highlighted } = renderList();

        fireEvent.change(search, { target: { value: "paris" } });
        fireEvent.change(search, { target: { value: "" } });

        expect(highlighted()).toHaveTextContent("Tokyo");
    });

    it("keeps the pinned zone and explains when nothing matches", () => {
        const { onSelect, search } = renderList();

        fireEvent.change(search, { target: { value: "zzzz" } });

        expect(screen.getAllByRole("option")).toHaveLength(1);
        expect(screen.getByText("No matches")).toBeInTheDocument();

        fireEvent.keyDown(search, { key: "Enter" });
        expect(onSelect).toHaveBeenCalledWith("UTC");
    });

    it("exposes exactly one option as a tab stop: the highlighted one", () => {
        const { highlighted } = renderList();
        const tabStops = screen
            .getAllByRole("option")
            .filter((option) => option.getAttribute("tabindex") === "0");

        expect(tabStops).toEqual([highlighted()]);
    });

    it("moves focus through the list with the keyboard once tabbed into", () => {
        const { highlighted } = renderList("UTC");
        const options = screen.getAllByRole("option");

        options[0].focus();
        fireEvent.keyDown(options[0], { key: "ArrowDown" });
        expect(document.activeElement).toBe(options[1]);
        expect(highlighted()).toBe(options[1]);

        fireEvent.keyDown(document.activeElement!, { key: "End" });
        expect(document.activeElement).toBe(options.at(-1));

        fireEvent.keyDown(document.activeElement!, { key: "Home" });
        expect(document.activeElement).toBe(options[0]);
    });

    it.each(["Enter", " "])("selects the focused option with %j", (key) => {
        const { onSelect } = renderList("UTC");
        const options = screen.getAllByRole("option");

        options[0].focus();
        fireEvent.keyDown(options[0], { key: "ArrowDown" });
        fireEvent.keyDown(document.activeElement!, { key });

        const secondZone = getAllTimezones().find((timezone) => timezone.id !== "UTC")!;
        expect(onSelect).toHaveBeenCalledOnce();
        expect(onSelect).toHaveBeenCalledWith(secondZone.id);
    });

    it("jumps back to the search box when typing in the list", () => {
        const { search } = renderList();
        const option = screen.getAllByRole("option")[0];

        option.focus();
        fireEvent.keyDown(option, { key: "p" });

        expect(document.activeElement).toBe(search);
    });

    it("selects a zone on click", () => {
        const { onSelect } = renderList();

        fireEvent.click(screen.getAllByRole("option")[0]);

        expect(onSelect).toHaveBeenCalledWith("UTC");
    });
});
