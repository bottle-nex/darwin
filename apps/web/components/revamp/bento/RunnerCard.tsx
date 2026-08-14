"use client";

import { motion, useReducedMotion } from "motion/react";
import BentoCard from "./BentoCard";
import type { BentoCardLightingProps } from "@/types/bento.type";

const PROMPT_PATH = "M30 36L48 50L30 64";

export default function RunnerCard({ lit, litDelay }: BentoCardLightingProps) {
    const reduceMotion = useReducedMotion();

    return (
        <BentoCard
            number="3"
            title="The work gets verified"
            description="Sandboxed compute clones your project and makes the change against the real thing. The build runs. The tests run. Nothing moves forward until they pass."
            accent="#22d3ee"
            accentAlt="#ff9a62"
            surface="bg-white/2"
            lit={lit}
            litDelay={litDelay}
        >
            <svg
                aria-hidden
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                fill="none"
            >
                <defs>
                    <linearGradient id="runner-stroke" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a5f3fc" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="runner-glow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>
                <motion.g
                    animate={reduceMotion ? undefined : { opacity: [0.5, 0.95, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <motion.path
                        d={PROMPT_PATH}
                        stroke="#22d3ee"
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#runner-glow)"
                        initial={reduceMotion ? false : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.8, delay: 0.35, ease: "easeInOut" }}
                    />
                </motion.g>
                <motion.path
                    d={PROMPT_PATH}
                    stroke="url(#runner-stroke)"
                    strokeWidth={6.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, delay: 0.35, ease: "easeInOut" }}
                />
                <motion.rect
                    x={56}
                    y={59}
                    width={17}
                    height={5.5}
                    rx={2.75}
                    fill="url(#runner-stroke)"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    whileInView={{ opacity: reduceMotion ? 1 : [1, 1, 0, 0] }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={
                        reduceMotion
                            ? { duration: 0.3 }
                            : { duration: 1.1, delay: 1.2, repeat: Infinity, ease: "linear" }
                    }
                />
            </svg>
        </BentoCard>
    );
}
