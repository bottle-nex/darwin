"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const TILE_VARIANTS: Variants = {
    rest: { y: 0, scale: 1 },
    hover: { y: -5, scale: 1.04, transition: { type: "spring", stiffness: 260, damping: 18 } },
};

const GLOW_VARIANTS: Variants = {
    rest: { opacity: 0.55, transition: { duration: 0.45 } },
    hover: { opacity: 1, transition: { duration: 0.45 } },
};

const SPARKLE_PATH = "M6 0L7.4 4.6L12 6L7.4 7.4L6 12L4.6 7.4L0 6L4.6 4.6Z";

function Sparkle({
    className,
    delay = 0,
    size = 10,
}: {
    className?: string;
    delay?: number;
    size?: number;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 12 12"
            width={size}
            height={size}
            className={cn("absolute z-10 fill-snow/80", className)}
            animate={
                reduceMotion ? undefined : { opacity: [0.15, 0.9, 0.15], scale: [0.6, 1, 0.6] }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay }}
        >
            <path d={SPARKLE_PATH} />
        </motion.svg>
    );
}

function CornerGrid({ color, corner }: { color: string; corner: "tr" | "bl" }) {
    const mask =
        corner === "tr"
            ? "radial-gradient(circle at 88% 10%, black, transparent 44%)"
            : "radial-gradient(circle at 10% 90%, black, transparent 40%)";

    return (
        <div
            aria-hidden
            className="absolute -inset-4"
            style={{
                backgroundImage: `linear-gradient(${color}30 1px, transparent 1px), linear-gradient(90deg, ${color}30 1px, transparent 1px)`,
                backgroundSize: "11px 11px",
                maskImage: mask,
                WebkitMaskImage: mask,
            }}
        />
    );
}

type BentoCardProps = {
    number: string;
    title: string;
    description: string;
    /** 6-digit hex — drives the tile glow and the top-right corner grid. */
    accent: string;
    /** Optional second hex for the bottom-left corner grid; falls back to `accent`. */
    accentAlt?: string;
    /** Card surface class, e.g. "bg-white/2" — keeps the alternating brightness of the row. */
    surface: string;
    tileClassName?: string;
    lit: boolean;
    litDelay: number;
    /** Glyph artwork rendered inside the tile, above its texture layer. */
    children: ReactNode;
};

export default function BentoCard({
    number,
    title,
    description,
    accent,
    accentAlt,
    surface,
    tileClassName,
    lit,
    litDelay,
    children,
}: BentoCardProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial="rest"
            whileHover={reduceMotion ? undefined : "hover"}
            style={{ "--lit-delay": `${litDelay}ms` } as CSSProperties}
            className={cn(
                "lit-edge relative flex h-full flex-col rounded-[10px] bg-linear-to-br from-white/5 to-transparent p-8 md:h-96",
                lit && "is-lit",
                surface,
            )}
        >
            <span className="text-[2.25rem] leading-none font-light text-snow/70">{number}</span>
            <div className="flex min-h-0 flex-1 items-center justify-center py-4">
                <motion.div
                    variants={TILE_VARIANTS}
                    className="relative aspect-square w-[46%] max-w-[8.5rem]"
                >
                    <motion.div variants={GLOW_VARIANTS} className="absolute -inset-6">
                        <motion.div
                            className="h-full w-full rounded-full blur-2xl"
                            style={{
                                background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)`,
                            }}
                            animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                    <CornerGrid color={accent} corner="tr" />
                    <CornerGrid color={accentAlt ?? accent} corner="bl" />
                    <Sparkle className="-top-2 -left-3" size={12} />
                    <Sparkle className="-top-1 -right-4" delay={1.1} />
                    <Sparkle className="-bottom-3 -left-2" delay={2.2} size={8} />
                    <div
                        className={cn(
                            "relative h-full w-full overflow-hidden rounded-[22%] border border-white/10 bg-linear-to-br from-white/12 via-graphite to-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_48px_-24px_rgba(0,0,0,0.9)]",
                            tileClassName,
                        )}
                    >
                        <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
                                backgroundSize: "8px 8px",
                                maskImage:
                                    "radial-gradient(circle at 50% 50%, black, transparent 80%)",
                                WebkitMaskImage:
                                    "radial-gradient(circle at 50% 50%, black, transparent 80%)",
                            }}
                        />
                        {children}
                    </div>
                </motion.div>
            </div>
            <div>
                <h3 className="text-xl leading-snug text-snow">{title}</h3>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-neutral-500">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}
