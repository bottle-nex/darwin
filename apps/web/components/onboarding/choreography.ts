import type { Variants } from "motion/react";

export const SPEED = {
    stop: 0,
    jog: 90,
    sprint: 420,
} as const;

export type SpeedTarget = keyof typeof SPEED;

export const SPEED_LERP = 8;
export const WIND_SPEED = 12;

export const ADVANCE_TOTAL_MS = 1200;
export const BACK_TOTAL_MS = 700;
export const JUMP_DELAY_MS = 300;

export const stepVariants: Variants = {
    enter: (direction: number = 1) => ({ opacity: 0, y: direction < 0 ? -20 : 20 }),
    center: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            delay: 0.25,
            ease: [0.16, 1, 0.3, 1],
            delayChildren: 0.3,
            staggerChildren: 0.05,
        },
    },
    exit: (direction: number = 1) => ({
        opacity: 0,
        y: direction < 0 ? 20 : -20,
        transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
    }),
};

export const stepItemVariants: Variants = {
    enter: { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const screenVariants: Variants = {
    enter: { opacity: 0, y: 20 },
    center: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            delay: 0.25,
            ease: [0.16, 1, 0.3, 1],
            delayChildren: 0.3,
            staggerChildren: 0.05,
        },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};
