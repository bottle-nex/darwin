"use client";

import { motion } from "motion/react";
import { MdOutlineChevronRight } from "react-icons/md";

import { Button } from "@/components/ui/button";

const HEADLINE = ["First,", "a", "short", "run."];

export default function IntroScreen({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            exit={{ opacity: 0, y: -20, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
            className="pointer-events-auto absolute top-[18vh] left-[8vw] w-full max-w-xl pr-6"
        >
            <h1
                aria-label={HEADLINE.join(" ")}
                className="flex flex-wrap gap-x-[0.28em] text-5xl font-medium tracking-tight text-neutral-100 md:text-6xl"
            >
                {HEADLINE.map((word, i) => (
                    <span key={i} aria-hidden className="overflow-hidden py-1">
                        <motion.span
                            className="inline-block"
                            initial={{ y: "110%" }}
                            animate={{
                                y: 0,
                                transition: {
                                    duration: 0.6,
                                    delay: 0.2 + i * 0.08,
                                    ease: [0.16, 1, 0.3, 1],
                                },
                            }}
                        >
                            {word}
                        </motion.span>
                    </span>
                ))}
            </h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.5 } }}
                className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-400"
            >
                Four stops before the board: the project, the repo, the team, and the brief your
                agent reads before every issue. Skip any of them.
            </motion.p>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 1.05, duration: 0.4 } }}
                className="mt-9 flex items-center gap-5"
            >
                <Button onClick={onStart}>
                    <span>Start Onboarding</span>
                    <MdOutlineChevronRight />
                </Button>
            </motion.div>
        </motion.div>
    );
}
