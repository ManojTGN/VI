"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./DevToolbar.module.css";

export type DevAction = {
    label: string;
    run: () => void;
};

export type DevActionGroup = {
    title: string;
    actions: DevAction[];
};

type DevToolbarProps = {
    groups: DevActionGroup[];
};

export function DevToolbar({ groups }: DevToolbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Escape" && isOpen) {
            setIsOpen(false);
            toggleRef.current?.focus();
        }
    };

    return (
        <aside
            className={styles.toolbar}
            data-open={isOpen}
            aria-label="Developer tools"
            onKeyDown={handleKeyDown}
        >
            <button
                ref={toggleRef}
                type="button"
                className={styles.toggle}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setIsOpen((open) => !open)}
            >
                Dev tools
            </button>

            {isOpen && (
                <div id={panelId} className={styles.panel}>
                    {groups.map((group) => (
                        <section key={group.title} className={styles.group}>
                            <h2 className={styles.groupTitle}>{group.title}</h2>
                            <div className={styles.actions}>
                                {group.actions.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        className={styles.action}
                                        onClick={action.run}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </aside>
    );
}
