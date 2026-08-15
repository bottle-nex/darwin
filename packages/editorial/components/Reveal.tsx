"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type RevealProps = {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
};

export function Reveal({ children, className, delay = 0, duration = 0.9 }: RevealProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
                duration: reduceMotion ? 0.2 : duration,
                ease: [0.22, 1, 0.36, 1],
                delay,
            }}
        >
            {children}
        </motion.div>
    );
}
