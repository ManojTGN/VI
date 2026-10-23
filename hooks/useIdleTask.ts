"use client";

import { useEffect } from "react";

export function useIdleTask(task: () => void) {
    useEffect(() => {
        if (typeof window.requestIdleCallback === "function") {
            const id = window.requestIdleCallback(task, { timeout: 4000 });
            return () => window.cancelIdleCallback(id);
        }

        const id = setTimeout(task, 2000);
        return () => clearTimeout(id);
    }, [task]);
}
