"use client";

import { memo, type MouseEvent } from "react";
import { OFFICIAL_SITE_URL } from "@/lib/release";
import { ViLogo } from "./ViLogo";
import styles from "./Brand.module.css";

function openInNewTab(event: MouseEvent<HTMLAnchorElement>) {
    const isPlainClick =
        event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

    if (!isPlainClick) {
        return;
    }

    event.preventDefault();
    window.open(OFFICIAL_SITE_URL, "_blank", "noopener,noreferrer");
}

export const Brand = memo(function Brand() {
    return (
        <a
            className={`${styles.brand} rise-in`}
            href={OFFICIAL_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Grand Theft Auto VI on the official Rockstar Games site (opens in a new tab)"
            onClick={openInNewTab}
        >
            <h1 className={styles.mark}>
                <ViLogo className={styles.logo} />
                <span className="sr-only">Grand Theft Auto VI</span>
            </h1>
        </a>
    );
});
