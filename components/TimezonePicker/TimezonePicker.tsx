"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { memo, useMemo, useRef } from "react";
import { getTimezoneLabel } from "@/lib/timezones";
import { TimezoneList } from "./TimezoneList";
import { TimezoneTrigger } from "./TimezoneTrigger";
import styles from "./TimezonePicker.module.css";

type TimezonePickerProps = {
    timezone: string;
    localTimezone: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSelect: (timezone: string) => void;
};

export const TimezonePicker = memo(function TimezonePicker({
    timezone,
    localTimezone,
    isOpen,
    onOpenChange,
    onSelect,
}: TimezonePickerProps) {
    const searchRef = useRef<HTMLInputElement>(null);
    const label = useMemo(() => getTimezoneLabel(timezone), [timezone]);

    const handleSelect = (nextTimezone: string) => {
        onSelect(nextTimezone);
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <TimezoneTrigger label={label} />

            <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay}>
                    <Dialog.Content
                        className={styles.panel}
                        onOpenAutoFocus={(event) => {
                            event.preventDefault();
                            searchRef.current?.focus();
                        }}
                    >
                        <header className={styles.header}>
                            <Dialog.Title className={styles.title}>Time zone</Dialog.Title>
                            <Dialog.Close className={styles.close} aria-label="Close">
                                <svg viewBox="0 0 24 24" aria-hidden>
                                    <path d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            </Dialog.Close>
                        </header>

                        <Dialog.Description className="sr-only">
                            Choose the time zone to count down in.
                        </Dialog.Description>

                        <TimezoneList
                            searchRef={searchRef}
                            selectedTimezone={timezone}
                            localTimezone={localTimezone}
                            onSelect={handleSelect}
                        />
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog.Root>
    );
});
