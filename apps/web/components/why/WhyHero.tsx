"use client";
import { motion } from "motion/react";
import { PiArrowRight } from "react-icons/pi";
import { MdArrowForward } from "react-icons/md";
import { azeretMono } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MatchaLogo } from "@/components/logo/MatchaLogo";

const HERO_CHAMFER =
    "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";

const HERO_TICKER_ITEMS = ["Reads the repo", "Writes the patch", "Opens the PR"];
// Repeated enough times that a single copy is wider than any realistic viewport,
// so the seamless 0% -> -50% loop never runs out of text mid-scroll.
const HERO_TICKER_COPY = Array.from({ length: 8 }, () => HERO_TICKER_ITEMS).flat();

// A few brief, gentle position/opacity flickers per 4s loop, with long calm
// holds in between — most of the timeline sits at rest (x:0, y:0, opacity:.08).
const WATERMARK_GLITCH_TIMES = [
    0, 0.02, 0.04, 0.05, 0.15, 0.155, 0.16, 0.17, 0.18, 0.4, 0.403, 0.406, 0.41, 0.415, 0.65, 0.652,
    0.655, 0.66, 0.665, 1,
];
const WATERMARK_GLITCH = {
    x: [0, 3, -2, 0, 0, -3, 2, -1, 0, 0, 4, -3, 1, 0, 0, -2, 3, -1, 0, 0],
    y: [0, -1, 1, 0, 0, 0, -1, 0.5, 0, 0, 0, 1, -0.5, 0, 0, -1.5, 1, 0, 0, 0],
    opacity: [
        0.08, 0.1, 0.06, 0.08, 0.08, 0.11, 0.09, 0.1, 0.08, 0.08, 0.12, 0.06, 0.09, 0.08, 0.08,
        0.13, 0.05, 0.09, 0.08, 0.08,
    ],
};

function HeroButton({
    variant,
    children,
}: {
    variant: "solid" | "outline";
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            style={{ clipPath: HERO_CHAMFER }}
            className={cn(
                "inline-flex cursor-pointer items-center gap-2 px-8 py-4 text-[13.6px] font-bold transition-opacity hover:opacity-80",
                azeretMono.className,
                variant === "solid"
                    ? "bg-ink text-white"
                    : "border-2 border-ink/30 bg-transparent text-ink",
            )}
        >
            {children}
        </button>
    );
}

export function WhyHero() {
    return (
        <div className="relative flex h-[calc(100vh-4.25rem)] w-screen flex-col overflow-hidden bg-[#ab9ff2]">
            <div className="pointer-events-none absolute top-1/2 right-[-8%] w-[50%] -translate-y-1/2">
                <motion.div
                    animate={WATERMARK_GLITCH}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                        times: WATERMARK_GLITCH_TIMES,
                    }}
                >
                    <MatchaLogo className="text-ink" />
                </motion.div>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-8 px-12 py-28">
                <h1 className="max-w-4xl text-[clamp(3rem,7vw,7rem)] leading-[0.88] font-bold tracking-[-0.04em] text-ink">
                    Ship the backlog, not the burnout
                </h1>
                <div className="max-w-xl text-lg leading-relaxed font-semibold text-ink/85">
                    Issues used to wait for an engineer with a free afternoon. Now you assign them
                    to an agent that reads the repo, writes the patch, and opens a PR, you review
                    the diff instead of writing it.
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <HeroButton variant="solid">
                        Get started
                        <PiArrowRight className="h-3 w-3" />
                    </HeroButton>
                    <HeroButton variant="outline">
                        See how it works
                        <MdArrowForward />
                    </HeroButton>
                </div>
            </div>

            <div className="relative z-10 overflow-hidden border-t border-ink/15 py-3">
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 60, ease: "linear", repeat: Infinity }}
                    className={cn(
                        "flex w-max gap-16 text-[12.8px] tracking-widest text-ink/70 uppercase",
                        azeretMono.className,
                    )}
                >
                    {[...HERO_TICKER_COPY, ...HERO_TICKER_COPY].map((item, i) => (
                        <span key={i} className="flex items-center gap-16 whitespace-nowrap">
                            {item}
                            <span aria-hidden>•</span>
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
