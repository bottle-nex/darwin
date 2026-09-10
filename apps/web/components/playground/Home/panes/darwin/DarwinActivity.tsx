"use client";
import { useEffect, useState } from "react";

const ELAPSED_AFTER_SECONDS = 3;

export default function DarwinActivity({ label }: { label: string }) {
    const [startedAt] = useState(() => Date.now());
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startedAt]);

    return (
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
            <span className="shimmer-text">{label}</span>
            {seconds >= ELAPSED_AFTER_SECONDS && (
                <span className="text-xs tabular-nums text-neutral-600">{seconds}s</span>
            )}
        </p>
    );
}
