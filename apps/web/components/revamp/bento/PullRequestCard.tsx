"use client";

import { motion, useReducedMotion } from "motion/react";
import BentoCard from "./BentoCard";
import type { BentoCardLightingProps } from "@/types/bento.type";

const TRUNK_PATH = "M34 33V66";
const BRANCH_PATH = "M41 26H52Q62 26 62 36V66";

function draw(delay: number, reduceMotion: boolean | null) {
    return {
        initial: reduceMotion ? false : { pathLength: 0, opacity: 0 },
        whileInView: { pathLength: 1, opacity: 1 },
        viewport: { once: true, amount: 0.4 },
        transition: { duration: 0.7, delay, ease: "easeInOut" as const },
    };
}

function pop(delay: number, reduceMotion: boolean | null) {
    return {
        initial: reduceMotion ? false : { scale: 0, opacity: 0 },
        whileInView: { scale: 1, opacity: 1 },
        viewport: { once: true, amount: 0.4 },
        transition: { delay, type: "spring" as const, bounce: 0.4, duration: 0.6 },
    };
}

export default function PullRequestCard({ lit, litDelay }: BentoCardLightingProps) {
    const reduceMotion = useReducedMotion();

    return (
        <BentoCard
            number="4"
            title="You review the PR"
            description="The diff and the reasoning land in your repo as a pull request. Approve it, or send it back with notes. Nothing merges itself."
            accent="#ab9ff2"
            accentAlt="#ff9a62"
            surface="bg-white/8"
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
                    <linearGradient id="pr-stroke" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#d8d2ff" />
                        <stop offset="100%" stopColor="#8f7ff0" />
                    </linearGradient>
                    <filter id="pr-glow" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="4.5" />
                    </filter>
                </defs>
                <motion.circle
                    cx={62}
                    cy={73}
                    r={9}
                    fill="#ab9ff2"
                    filter="url(#pr-glow)"
                    className="origin-center [transform-box:fill-box]"
                    animate={
                        reduceMotion
                            ? undefined
                            : { opacity: [0.35, 0.85, 0.35], scale: [1, 1.25, 1] }
                    }
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <g
                    stroke="url(#pr-stroke)"
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    className="[&_circle]:origin-center [&_circle]:[transform-box:fill-box]"
                >
                    <motion.circle cx={34} cy={26} r={6.5} {...pop(0.25, reduceMotion)} />
                    <motion.path d={TRUNK_PATH} {...draw(0.5, reduceMotion)} />
                    <motion.circle cx={34} cy={73} r={6.5} {...pop(1.0, reduceMotion)} />
                    <motion.path d={BRANCH_PATH} {...draw(0.75, reduceMotion)} />
                    <motion.circle cx={62} cy={73} r={6.5} {...pop(1.2, reduceMotion)} />
                </g>
            </svg>
        </BentoCard>
    );
}
