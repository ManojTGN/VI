"use client";

import { useEffect } from "react";
import "./globals.css";
import styles from "./error.module.css";

type GlobalErrorProps = {
    error: unknown;
    retry: () => void;
};

export default function GlobalError({ error, retry }: GlobalErrorProps) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <title>Grand Theft Auto VI</title>
                <main className={styles.screen}>
                    <h1 className={styles.title}>Wasted</h1>
                    <p className={styles.message}>Something went wrong. Please reload the page.</p>
                    <button type="button" className={styles.retry} onClick={() => retry()}>
                        Try again
                    </button>
                </main>
            </body>
        </html>
    );
}
