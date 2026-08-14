"use client";

import { motion, useReducedMotion } from "motion/react";
import BentoCard from "./BentoCard";
import type { BentoCardLightingProps } from "@/types/bento.type";

const CHECK_PATH = "M30 52L45 66L72 36";

export default function AgentCard({ lit, litDelay }: BentoCardLightingProps) {
    const reduceMotion = useReducedMotion();

    return (
        <BentoCard
            number="2"
            title="An agent claims it"
            description="It pulls the card and reads the repo before touching a single line, learning your conventions, your structure, and the blast radius of the change. Then it plans the work."
            accent="#ff8a3c"
            accentAlt="#38bdf8"
            surface="bg-white/6"
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
                    <linearGradient id="agent-check-stroke" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffd9a8" />
                        <stop offset="100%" stopColor="#ff7a2f" />
                    </linearGradient>
                    <filter id="agent-check-glow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>
                <motion.g
                    animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <motion.path
                        d={CHECK_PATH}
                        stroke="#ff8a3c"
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#agent-check-glow)"
                        initial={reduceMotion ? false : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.9, delay: 0.35, ease: "easeInOut" }}
                    />
                </motion.g>
                <motion.path
                    d={CHECK_PATH}
                    stroke="url(#agent-check-stroke)"
                    strokeWidth={6.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.9, delay: 0.35, ease: "easeInOut" }}
                />
            </svg>
        </BentoCard>
    );
}
