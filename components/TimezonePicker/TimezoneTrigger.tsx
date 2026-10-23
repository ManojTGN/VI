"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useLabelFit } from "@/hooks/useLabelFit";
import { abbreviateLabel } from "@/lib/timezones";
import styles from "./TimezonePicker.module.css";

type TimezoneTriggerProps = {
    label: string;
};

function PinIcon() {
    return (
        <svg className={styles.pin} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
            <circle cx="12" cy="10" r="2.4" />
        </svg>
    );
}

export function TimezoneTrigger({ label }: TimezoneTriggerProps) {
    const shortLabel = abbreviateLabel(label);
    const { slotRef, fullRef, shortRef, fit } = useLabelFit(label);

    return (
        <div ref={slotRef} className={styles.slot}>
            <Dialog.Trigger
                className={`${styles.trigger} rise-in`}
                title={label}
                aria-label={`Time zone: ${label}. Change time zone`}
            >
                {fit === "icon" ? (
                    <PinIcon />
                ) : (
                    <span className={styles.label}>{fit === "short" ? shortLabel : label}</span>
                )}
                <span ref={fullRef} className={styles.measure} aria-hidden>
                    {label}
                </span>
                <span ref={shortRef} className={styles.measure} aria-hidden>
                    {shortLabel}
                </span>
            </Dialog.Trigger>
        </div>
    );
}
