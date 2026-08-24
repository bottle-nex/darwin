"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const TICK_WIDTH = 8;
const SPRING = { stiffness: 120, damping: 25, restDelta: 0.0001 } as const;
const BADGE_TOP = 26;

// Current wall-clock position, in pixels from the timeline origin.
function nowOffsetX(originMinute: number): number {
    const d = new Date();
    const ms =
        (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) * 1000 + d.getMilliseconds();
    // TESTING: 1 tick = 1 second. Revert: change / 1000 back to / 60000
    const secondOfDay = ms / 1000;
    return (secondOfDay - originMinute) * TICK_WIDTH;
}

function getLabel(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface TimelineStickProps {
    originMinute: number;
}

export default function TimelineStick({ originMinute }: TimelineStickProps) {
    const [label, setLabel] = useState(getLabel);

    const rawX = useMotionValue(nowOffsetX(originMinute));
    const springX = useSpring(rawX, SPRING);

    useEffect(() => {
        let raf: number;
        let lastMinute = -1;

        const tick = () => {
            rawX.set(nowOffsetX(originMinute));

            const now = new Date();
            const min = now.getHours() * 60 + now.getMinutes();
            if (min !== lastMinute) {
                lastMinute = min;
                setLabel(getLabel());
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [rawX, originMinute]);

    return (
        <motion.div
            className="absolute top-0 bottom-0 pointer-events-none z-30"
            style={{ left: 0, x: springX, width: 1, background: "rgba(231, 0, 11, 0.5)" }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeOut" } }}
        >
            <div
                className="absolute flex flex-col items-center"
                style={{ top: BADGE_TOP, transform: "translateX(-50%)" }}
            >
                <div
                    style={{
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "6px solid #e7000b",
                        marginBottom: 2,
                    }}
                />
                <div
                    className="rounded-full px-2.5 text-white font-medium whitespace-nowrap"
                    style={{
                        background: "#e7000b",
                        fontSize: "10px",
                        lineHeight: "18px",
                        letterSpacing: "0.04em",
                    }}
                >
                    {label}
                </div>
            </div>
        </motion.div>
    );
}
