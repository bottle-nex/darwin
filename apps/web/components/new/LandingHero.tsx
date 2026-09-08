"use client";
import { NavCtaArrowIcon, PlayCircleIcon } from "@trydarwin/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

import HeroActivityCards from "@/components/new/HeroActivityCards";
import HeroAgentRun from "@/components/new/HeroAgentRun";
import HeroCardStack from "@/components/new/HeroCardStack";
import {
    HERO_ACTION,
    HERO_ACTIONS,
    HERO_ASIDE_BOTTOM_LEFT,
    HERO_ASIDE_LEFT,
    HERO_ASIDE_RIGHT,
    HERO_BADGE,
    HERO_BODY,
    HERO_COPY,
    HERO_HEADLINE,
    HERO_WORD,
} from "@/components/new/landingHeroMotion";

const HEADLINE_WORDS = ["Every", "issue", "your", "team", "files."];

export default function LandingHero() {
    const reduceMotion = useReducedMotion();
    const initial = reduceMotion ? false : "hidden";

    return (
        <section className="relative h-svh w-full overflow-hidden text-foreground">
            <motion.div
                initial={initial}
                animate="show"
                variants={HERO_ASIDE_LEFT}
                className="absolute top-[15%] left-[8%] hidden lg:block"
            >
                <HeroCardStack />
            </motion.div>

            <motion.div
                initial={initial}
                animate="show"
                variants={HERO_ASIDE_RIGHT}
                className="absolute right-[5%] bottom-[9%] hidden lg:block"
            >
                <HeroActivityCards />
            </motion.div>

            <motion.div
                initial={initial}
                animate="show"
                variants={HERO_ASIDE_BOTTOM_LEFT}
                className="absolute bottom-[8%] left-[8%] hidden lg:block"
            >
                <HeroAgentRun className="rotate-3" />
            </motion.div>

            <motion.div
                initial={initial}
                animate="show"
                variants={HERO_COPY}
                className="mx-auto max-w-7xl flex items-center justify-center h-full"
            >
                <section className="max-w-3xl translate-y-[1vh]">
                    <motion.p variants={HERO_BADGE} className="mx-auto flex w-fit items-center gap-x-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-all duration-150 ease-in cursor-pointer hover:-translate-y-0.5 px-4 py-2 text-[12px] text-[#6c4dd1]">
                        <span className="font-mono text-[11px] tracking-[0.2em]">NEW</span>
                        <span className="font-medium">Runners now run your test suite</span>
                        <span className="text-[#6c4dd1]/55">See the changelog</span>
                        <NavCtaArrowIcon className="ml-1 size-4" />
                    </motion.p>
                    <motion.h1
                        variants={HERO_HEADLINE}
                        className="font-headline text-[4.5rem]/none text-center font-[500] mt-10"
                    >
                        {HEADLINE_WORDS.map((word) => (
                            <Fragment key={word}>
                                <motion.span
                                    variants={HERO_WORD}
                                    className="inline-block will-change-[transform,filter]"
                                >
                                    {word}
                                </motion.span>{" "}
                            </Fragment>
                        ))}
                        <motion.span
                            variants={HERO_WORD}
                            className="inline-block font-pixel will-change-[transform,filter]"
                        >
                            Mapped
                        </motion.span>
                    </motion.h1>
                    <motion.p
                        variants={HERO_BODY}
                        className="mx-auto text-[15px] text-center mt-10 max-w-xl font-medium"
                    >
                        Your team drops issues on the board. A darwin agent claims one, runs your
                        codebase in a sandboxed runner, verifies the fix, and opens the pull request
                    </motion.p>

                    <motion.div
                        variants={HERO_ACTIONS}
                        className="mt-9 flex items-center justify-center gap-x-7"
                    >
                        <motion.button
                            variants={HERO_ACTION}
                            type="button"
                            className="inline-flex h-11 cursor-pointer items-center gap-x-3 rounded-lg bg-linear-to-b from-[#2b2b2b] via-[#2b2b2b] to-neutral-700 px-5 text-[14px] font-medium text-snow shadow-[0_3px_0_0_#151516,0_8px_16px_-6px_rgba(24,24,27,0.35)] transition-all duration-150 hover:bg-[#343435] active:translate-y-[2px] active:shadow-[0_1px_0_0_#151516,0_3px_6px_-4px_rgba(24,24,27,0.35)]"
                        >
                            Start for free
                            <NavCtaArrowIcon className="size-4" />
                        </motion.button>

                        <motion.button
                            variants={HERO_ACTION}
                            type="button"
                            className="group inline-flex cursor-pointer items-center gap-x-2 text-[14px] font-medium text-foreground"
                        >
                            <PlayCircleIcon className="size-5 text-muted-foreground" />
                            <span className="border-b border-edge pb-0.5 transition-colors group-hover:border-foreground/40">
                                See it work
                            </span>
                        </motion.button>
                    </motion.div>
                </section>
            </motion.div>
        </section>
    );
}
