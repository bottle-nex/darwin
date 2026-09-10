"use client";
import { NavCtaArrowIcon } from "@trydarwin/ui/icons";
import { motion, useReducedMotion } from "motion/react";

import BlurFade from "@/components/landing/BlurFade";

import WhyHeroScene from "./WhyHeroScene";

const EASE = [0.22, 1, 0.36, 1] as const;

const CARD_DELAY_S = 0.9;
const CARD_DROP_S = 1.3;
const CARD_REST = { rotateX: 36, rotateZ: -5, y: 0 };
const CARD_START = { rotateX: 50, rotateZ: -12, y: -120 };

export default function WhyHero() {
    const reduce = useReducedMotion();

    return (
        <section className="relative w-full overflow-hidden pt-40">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
                <BlurFade>
                    <motion.p className="mx-auto flex w-fit items-center gap-x-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-all duration-150 ease-in cursor-pointer hover:-translate-y-0.5 px-4 py-2 text-[12px] text-[#6c4dd1] scale-95">
                        <span className="font-mono text-[11px] tracking-[0.2em]">NEW</span>
                        <span className="font-medium">Runners now run your test suite</span>
                        <span className="text-[#6c4dd1]/55">See the changelog</span>
                        <NavCtaArrowIcon className="ml-1 size-4" />
                    </motion.p>
                </BlurFade>
                <BlurFade
                    duration={1.1}
                    className="font-headline text-6xl leading-[1.05] tracking-tight text-foreground max-lg:text-5xl mt-6"
                >
                    A board that empties itself.
                </BlurFade>
                <BlurFade
                    delay={0.2}
                    duration={1.1}
                    className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/55"
                >
                    Darwin&apos;s agents claim your issues, build and verify the fix in a sandboxed
                    runner, and hand back a PR. Here is why we built engineering this way.
                </BlurFade>
            </div>

            <div
                className="relative mx-auto mt-24 hidden h-[40rem] w-full max-w-[1300px] sm:block"
                style={{ perspective: "2000px" }}
            >
                <motion.div
                    className="absolute -top-12 left-[10%] w-[120%] origin-top"
                    style={{ transformStyle: "preserve-3d" }}
                    initial={reduce ? false : { opacity: 0, ...CARD_START }}
                    animate={{ opacity: 1, ...CARD_REST }}
                    transition={{
                        duration: reduce ? 0 : CARD_DROP_S,
                        ease: EASE,
                        delay: reduce ? 0 : CARD_DELAY_S,
                    }}
                >
                    <WhyHeroScene />
                </motion.div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[46rem] bg-[linear-gradient(to_right,transparent_45%,var(--color-ink)_90%)] sm:block" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[46rem] bg-[linear-gradient(to_bottom,transparent_50%,var(--color-ink)_92%)] sm:block" />
        </section>
    );
}
