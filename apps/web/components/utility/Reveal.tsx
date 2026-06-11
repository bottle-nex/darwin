"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
    children: ReactNode;
    delay?: number;
    className?: string;
    immediate?: boolean;
};

export default function Reveal({ children, delay = 0, className, immediate = false }: RevealProps) {
    const reduceMotion = useReducedMotion();
    const hidden = { opacity: 0, y: reduceMotion ? 0 : 20 };
    const visible = { opacity: 1, y: 0 };

    return (
        <motion.div
            className={className}
            initial={hidden}
            {...(immediate
                ? { animate: visible }
                : { whileInView: visible, viewport: { once: true, amount: 0.3 } })}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}
