"use client";

import { motion, useReducedMotion } from "motion/react";
import BentoCard from "./BentoCard";
import type { BentoCardLightingProps } from "@/types/bento.type";

const ARC_RADII = [16, 26, 36, 46, 56, 66, 76, 86, 96, 106, 116, 126, 136, 146];

export default function BoardCard({ lit, litDelay }: BentoCardLightingProps) {
    const reduceMotion = useReducedMotion();

    return (
        <BentoCard
            number="1"
            title="File an issue"
            description="Drop it on the board your team already plans on. Scope it the way you'd brief a teammate: what's broken, what good looks like, and anything the code won't tell you on its own."
            accent="#ff9a62"
            accentAlt="#7dd3fc"
            surface="bg-white/2"
            tileClassName="bg-[radial-gradient(130%_130%_at_88%_8%,#ffb27d_0%,#c67a55_26%,#4a5268_60%,#262b38_100%)]"
            lit={lit}
            litDelay={litDelay}
        >
            <svg
                aria-hidden
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                fill="none"
            >
                {ARC_RADII.map((r, i) => (
                    <motion.circle
                        key={r}
                        cx={-6}
                        cy={106}
                        r={r}
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={0.5}
                        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 1.1, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                    />
                ))}
                {/* Kanban mark, top-left — three columns at different fill heights. */}
                <g fill="rgba(255,255,255,0.7)">
                    <rect x={13} y={13} width={3} height={9} rx={1.5} />
                    <rect x={18.5} y={13} width={3} height={6} rx={1.5} />
                    <rect x={24} y={13} width={3} height={11} rx={1.5} />
                </g>
            </svg>
            {!reduceMotion && (
                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.16) 48%, transparent 64%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        repeatDelay: 2.6,
                        ease: "easeInOut",
                    }}
                />
            )}
        </BentoCard>
    );
}
