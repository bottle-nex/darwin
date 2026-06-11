"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type FloatingCardProps = {
    children: ReactNode;
    className?: string;
    rotation?: string;
    bob?: { distance: number; duration: number; delay: number };
    entranceDelay?: number;
    inView?: boolean;
};

export default function FloatingCard({
    children,
    className,
    rotation,
    bob = { distance: -10, duration: 7, delay: 0 },
    entranceDelay = 0.2,
    inView = false,
}: FloatingCardProps) {
    const reduceMotion = useReducedMotion();
    const hidden = { opacity: 0, y: reduceMotion ? 0 : 40 };
    const visible = { opacity: 1, y: 0 };

    return (
        <motion.div
            initial={hidden}
            {...(inView
                ? { whileInView: visible, viewport: { once: true, amount: 0.4 } }
                : { animate: visible })}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: entranceDelay }}
            className={className}
        >
            <motion.div
                animate={reduceMotion ? undefined : { y: [0, bob.distance, 0] }}
                transition={{
                    duration: bob.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: bob.delay,
                }}
            >
                <div
                    style={rotation ? { transform: rotation } : undefined}
                    className="[filter:drop-shadow(0_20px_36px_rgba(15,23,42,0.12))]"
                >
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
}
