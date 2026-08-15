"use client";

import { motion } from "motion/react";

export default function BlurFade({
    className,
    delay = 0,
    duration = 2.0,
    children,
}: {
    className?: string;
    delay?: number;
    duration?: number;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 12, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: duration, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}
