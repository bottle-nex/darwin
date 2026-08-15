"use client";

import { motion, useReducedMotion } from "motion/react";

export default function DiagramScene({
    children,
    hover,
}: {
    children: React.ReactNode;
    /** Variant label activated while the pointer is over the scene (e.g. "connected"). */
    hover?: string;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 280 200"
            className="h-full w-full font-mono"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            whileHover={reduceMotion || !hover ? undefined : hover}
            viewport={{ once: true, amount: 0.4 }}
        >
            {children}
        </motion.svg>
    );
}
