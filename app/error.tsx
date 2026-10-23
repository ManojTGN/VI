"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

type ErrorPageProps = {
    error: unknown;
    retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className={styles.screen}>
            <h1 className={styles.title}>Wasted</h1>
            <p className={styles.message}>Something went wrong while loading the countdown.</p>
            <button type="button" className={styles.retry} onClick={() => retry()}>
                Try again
            </button>
        </main>
    );
}
