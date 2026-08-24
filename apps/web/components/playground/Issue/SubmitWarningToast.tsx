"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const WARNING_LIFETIME_MS = 2200;
/** How far above the button the toast settles (px). */
const WARNING_RAISE_Y = -44;

const shakeKeyframes = {
    x: [0, -4, 4, -3, 3, -1, 1, 0],
    transition: { duration: 0.4, ease: "easeInOut" as const },
};

export type SubmitWarning = { id: number; text: string } | null;

/**
 * Drives the "you forgot something" feedback on a submit button: `fire(text)`
 * rattles the button (attach `shakeControls` to a motion wrapper) and shows a
 * self-dismissing warning toast (render via SubmitWarningToast).
 */
export function useSubmitWarning() {
    const [warning, setWarning] = useState<SubmitWarning>(null);
    const counter = useRef(0);
    const shakeControls = useAnimationControls();

    useEffect(() => {
        if (!warning) return;
        const timeout = window.setTimeout(() => setWarning(null), WARNING_LIFETIME_MS);
        return () => window.clearTimeout(timeout);
    }, [warning]);

    function fire(text: string) {
        counter.current += 1;
        setWarning({ id: counter.current, text });
        shakeControls.start(shakeKeyframes);
    }

    return { warning, fire, shakeControls };
}

/** Warning pill that springs out from behind the submit button. Place inside a `relative isolate` wrapper. */
export default function SubmitWarningToast({
    warning,
    placement = "above",
}: {
    warning: SubmitWarning;
    placement?: "above" | "below";
}) {
    const below = placement === "below";
    return (
        <AnimatePresence>
            {warning && (
                <motion.div
                    key={warning.id}
                    initial={{
                        x: "-50%",
                        y: below ? 10 : -10,
                        opacity: 0,
                        scale: 0.7,
                        filter: "blur(4px)",
                    }}
                    animate={{
                        x: "-50%",
                        y: below ? -WARNING_RAISE_Y : WARNING_RAISE_Y,
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0px)",
                    }}
                    exit={{
                        opacity: 0,
                        filter: "blur(8px)",
                        transition: { duration: 0.4, ease: "easeOut" },
                    }}
                    transition={{ type: "spring", stiffness: 550, damping: 30 }}
                    className={cn(
                        "pointer-events-none absolute left-1/2 -z-10 rounded-full bg-brick px-4 py-1.5 text-xs font-medium whitespace-nowrap text-brick-foreground shadow-sm",
                        below ? "top-0" : "bottom-0",
                    )}
                >
                    {warning.text}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
