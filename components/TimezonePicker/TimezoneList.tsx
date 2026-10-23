"use client";

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
} from "react";
import { findTimezone, getAllTimezones, searchTimezones, type Timezone } from "@/lib/timezones";
import styles from "./TimezonePicker.module.css";

type TimezoneListProps = {
    searchRef: RefObject<HTMLInputElement | null>;
    selectedTimezone: string;
    localTimezone: string;
    onSelect: (timezone: string) => void;
};

type TimezoneOptionProps = {
    id: string;
    timezone: Timezone;
    isHighlighted: boolean;
    isSelected: boolean;
    onPointerMove: (event: PointerEvent) => void;
    onSelect: () => void;
};

type NavigationOptions = {
    current: number;
    last: number;
    allowPlainHomeEnd: boolean;
};

const PAGE_SIZE = 8;

function navigationTarget(
    event: KeyboardEvent,
    { current, last, allowPlainHomeEnd }: NavigationOptions,
) {
    const jumpsToEdge = allowPlainHomeEnd || event.ctrlKey || event.metaKey;

    switch (event.key) {
        case "ArrowDown":
            return current + 1;
        case "ArrowUp":
            return current - 1;
        case "PageDown":
            return current + PAGE_SIZE;
        case "PageUp":
            return current - PAGE_SIZE;
        case "Home":
            return jumpsToEdge ? 0 : null;
        case "End":
            return jumpsToEdge ? last : null;
        default:
            return null;
    }
}

function TimezoneOption({
    id,
    timezone,
    isHighlighted,
    isSelected,
    onPointerMove,
    onSelect,
}: TimezoneOptionProps) {
    return (
        <li
            id={id}
            role="option"
            aria-selected={isSelected}
            data-highlighted={isHighlighted}
            tabIndex={isHighlighted ? 0 : -1}
            className={styles.option}
            onPointerMove={onPointerMove}
            onClick={onSelect}
        >
            <span className={styles.city}>{timezone.city}</span>
            <span className={styles.offset}>{timezone.offsetLabel}</span>
            <svg className={styles.check} viewBox="0 0 24 24" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
        </li>
    );
}

export function TimezoneList({
    searchRef,
    selectedTimezone,
    localTimezone,
    onSelect,
}: TimezoneListProps) {
    const idPrefix = useId();
    const [query, setQuery] = useState("");
    const [highlightedId, setHighlightedId] = useState<string | null>(selectedTimezone);
    const lastPointer = useRef<string | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const local = useMemo(() => findTimezone(localTimezone), [localTimezone]);
    const matches = useMemo(
        () =>
            searchTimezones(getAllTimezones(), query).filter(
                (timezone) => timezone.id !== local.id,
            ),
        [query, local.id],
    );
    const options = useMemo(() => [local, ...matches], [local, matches]);

    const indexOf = (id: string | null) => options.findIndex((timezone) => timezone.id === id);
    const fallbackIndex = query
        ? Math.min(1, options.length - 1)
        : Math.max(0, indexOf(selectedTimezone));
    const foundIndex = indexOf(highlightedId);
    const highlightedIndex = foundIndex >= 0 ? foundIndex : fallbackIndex;
    const optionId = (index: number) => `${idPrefix}-option-${index}`;
    const highlightedOptionId = optionId(highlightedIndex);

    useEffect(() => {
        const option = document.getElementById(highlightedOptionId);
        const isListFocused = listRef.current?.contains(document.activeElement) ?? false;

        option?.scrollIntoView({ block: "nearest" });
        if (isListFocused && option !== document.activeElement) {
            option?.focus();
        }
    }, [highlightedOptionId]);

    const highlightIndex = (index: number) => {
        const next = Math.min(options.length - 1, Math.max(0, index));
        setHighlightedId(options[next].id);
    };

    const selectHighlighted = () => onSelect(options[highlightedIndex].id);

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.nativeEvent.isComposing) {
            return;
        }

        const target = navigationTarget(event, {
            current: highlightedIndex,
            last: options.length - 1,
            allowPlainHomeEnd: false,
        });

        if (target !== null) {
            event.preventDefault();
            highlightIndex(target);
        } else if (event.key === "Enter") {
            event.preventDefault();
            selectHighlighted();
        }
    };

    const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
        const target = navigationTarget(event, {
            current: highlightedIndex,
            last: options.length - 1,
            allowPlainHomeEnd: true,
        });

        if (target !== null) {
            event.preventDefault();
            highlightIndex(target);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectHighlighted();
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            searchRef.current?.focus();
        }
    };

    const followPointer = (timezoneId: string) => (event: PointerEvent) => {
        const position = `${event.clientX},${event.clientY}`;
        const hasMoved = lastPointer.current !== null && lastPointer.current !== position;
        lastPointer.current = position;

        if (hasMoved && timezoneId !== highlightedId) {
            setHighlightedId(timezoneId);
        }
    };

    const renderOption = (timezone: Timezone, index: number) => (
        <TimezoneOption
            key={timezone.id}
            id={optionId(index)}
            timezone={timezone}
            isHighlighted={index === highlightedIndex}
            isSelected={timezone.id === selectedTimezone}
            onPointerMove={followPointer(timezone.id)}
            onSelect={() => onSelect(timezone.id)}
        />
    );

    return (
        <>
            <input
                ref={searchRef}
                className={styles.search}
                type="search"
                placeholder="Search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setHighlightedId(null);
                }}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-label="Search time zones"
                aria-expanded="true"
                aria-controls={`${idPrefix}-list`}
                aria-autocomplete="list"
                aria-activedescendant={highlightedOptionId}
            />

            <ul
                ref={listRef}
                id={`${idPrefix}-list`}
                className={styles.list}
                role="listbox"
                aria-label="Time zones"
                onKeyDown={handleListKeyDown}
            >
                <li role="presentation" className={styles.groupHeading}>
                    Your time zone
                </li>
                {renderOption(local, 0)}

                <li role="presentation" className={styles.groupHeading}>
                    All time zones
                </li>
                {matches.map((timezone, index) => renderOption(timezone, index + 1))}

                {matches.length === 0 && (
                    <li role="presentation" className={styles.empty}>
                        No matches
                    </li>
                )}
            </ul>
        </>
    );
}
