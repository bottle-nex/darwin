"use client";

import { useEffect, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

export default function OfflineTicker() {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const sync = () => setOffline(!navigator.onLine);

        sync();
        window.addEventListener("online", sync);
        window.addEventListener("offline", sync);

        return () => {
            window.removeEventListener("online", sync);
            window.removeEventListener("offline", sync);
        };
    }, []);

    if (!offline) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-neutral-400 bg-cement rounded-full tracking-wide"
        >
            <ThinkingOrb state="solving" size={20} aria-label="Offline" />
            Offline
        </div>
    );
}
