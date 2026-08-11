"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { sourceSerif4 } from "@/lib/fonts";
import HeroPanel from "./HeroPanel";

const HEADLINE: { text: string; emphasis?: boolean; delay: number; breakAfter?: boolean }[] = [
    { text: "Where", delay: 0.3 },
    { text: "issues", emphasis: true, delay: 0.06 },
    { text: "become", delay: 0.48 },
    { text: "pull requests", emphasis: true, delay: 0.18 },
    { text: "without", delay: 0.54, breakAfter: true },
    { text: "anyone", delay: 0 },
    { text: "picking", delay: 0.36 },
    { text: "up", delay: 0.12 },
    { text: "the", delay: 0.42 },
    { text: "ticket.", delay: 0.24 },
];

const RISE = {
    initial: { y: "0.4em", opacity: 0 },
    animate: (delay: number) => ({
        y: 0,
        opacity: 1,
        transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

export default function LandingNewHero() {
    return (
        <div
            className={cn(
                "relative min-h-screen w-screen max-w-7xl mx-auto bg-transparent flex flex-col items-center pt-[11%] border-b",
            )}
        >
            <div className="flex w-full items-end justify-between pt-15">
                <motion.div
                    initial="initial"
                    animate="animate"
                    className={cn(
                        "text-5xl font-medium text-[#2a2524] tracking-tight leading-[1.1] max-w-[45rem]",
                    )}
                >
                    {HEADLINE.map((part) => {
                        const Word = part.emphasis ? motion.em : motion.span;

                        return (
                            <span key={part.text}>
                                <Word
                                    variants={RISE}
                                    custom={part.delay}
                                    className={cn(
                                        "inline-block mr-[0.24em]",
                                        part.emphasis &&
                                            "font-bold underline decoration-1 underline-offset-8",
                                    )}
                                >
                                    {part.text}
                                </Word>
                                {part.breakAfter && <br />}
                            </span>
                        );
                    })}
                </motion.div>

                <div
                    className={cn(
                        "text-[1.5rem] leading-[1.2] text-[#2a2524] tracking-tight max-w-md ",
                        sourceSerif4.className,
                    )}
                >
                    Drop the work on the board and walk away. Issues get claimed, implemented, and
                    verified, you come back to pull requests waiting on your review.
                </div>
            </div>
            <HeroPanel />
        </div>
    );
}
