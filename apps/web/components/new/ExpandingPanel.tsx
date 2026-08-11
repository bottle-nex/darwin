"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A panel that starts out filling its parent slot and, as the page scrolls,
 * grows until it covers the entire viewport.
 *
 * The panel is absolutely positioned inside the slot, so growing it never
 * reflows the document — only the panel's own subtree is laid out. Its geometry
 * is written as percentages of the slot (see `.expanding-panel` in globals.css),
 * which is why it can reach exactly 100vw x 100vh without being told how wide
 * the surrounding column is.
 *
 * Full coverage lands when the slot is centred in the viewport: the panel grows
 * symmetrically out of the slot, so a 100vh-tall panel centred on a centred slot
 * is exactly the viewport. Growth doesn't start at the top of the page though —
 * it's held at rest until the slot first peeks into view, then runs to that
 * centred, full-coverage point.
 *
 * The parent element must be `relative` and carry the resting size — it is both
 * the panel's containing block and the space the panel occupies in flow.
 */

const SCROLL_SPRING = { stiffness: 700, damping: 16, mass: 0.15 };

type ExpandingPanelProps = {
    className?: string;
    children: ReactNode;
};

export default function ExpandingPanel({ className, children }: ExpandingPanelProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const prefersReducedMotion = useReducedMotion();

    /** Scroll range, [slot enters view, slot centred/full coverage], as absolute page scroll. */
    const [growthRange, setGrowthRange] = useState({ start: 0, end: 1 });

    useEffect(() => {
        const slot = ref.current?.parentElement;
        if (!slot) return;

        const measure = () => {
            const rect = slot.getBoundingClientRect();
            const slotTop = rect.top + window.scrollY;
            const slotCentre = slotTop + rect.height / 2;

            const start = Math.max(0, slotTop - window.innerHeight);
            const end = Math.max(start + 1, slotCentre - window.innerHeight / 2);
            setGrowthRange({ start, end });
        };

        measure();

        // The slot drifts whenever anything above it reflows — a web font
        // landing, or the copy rewrapping at a new width.
        const observer = new ResizeObserver(measure);
        observer.observe(document.body);
        window.addEventListener("resize", measure);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    // 1 = resting in the slot, 0 = covering the viewport.
    const squeeze = useTransform(scrollY, [growthRange.start, growthRange.end], [1, 0]);
    const smoothSqueeze = useSpring(squeeze, SCROLL_SPRING);

    return (
        <motion.div
            ref={ref}
            className={cn("expanding-panel", className)}
            style={
                {
                    "--squeeze": prefersReducedMotion ? 1 : smoothSqueeze,
                } as CSSProperties
            }
        >
            {children}
        </motion.div>
    );
}
