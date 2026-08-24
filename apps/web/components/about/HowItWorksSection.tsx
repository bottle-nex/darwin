"use client";
import { motion, useScroll } from "motion/react";
import { useRef } from "react";

import Reveal from "@/components/utility/Reveal";
import { azeretMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { steps } from "./data";
import Eyebrow from "./Eyebrow";

export default function HowItWorksSection() {
    const railRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: railRef,
        offset: ["start 0.8", "end 0.55"],
    });

    return (
        <section className="">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-6 py-24">
                <Reveal>
                    <Eyebrow text="The loop" />
                </Reveal>
                <Reveal delay={0.08}>
                    <h2 className="text-5xl font-extralight text-neutral-100 md:text-6xl">
                        Board in. PRs out.
                    </h2>
                </Reveal>
                <div ref={railRef} className="relative mt-12">
                    <div className="absolute top-0 left-0 right-0 hidden h-px bg-white/10 md:block" />
                    <motion.div
                        style={{ scaleX: scrollYProgress }}
                        className="absolute top-0 left-0 right-0 hidden h-px origin-left bg-[#bcafff] md:block"
                    />
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
                        {steps.map((step, i) => (
                            <Reveal key={step.index} delay={i * 0.08} className="relative md:pt-10">
                                <div className="absolute top-0 left-0 hidden size-2 -translate-y-1/2 rounded-full bg-neutral-100 md:block" />
                                <div className="flex flex-col gap-3">
                                    <div
                                        className={cn(
                                            "text-xs uppercase tracking-wide text-neutral-500",
                                            azeretMono.className,
                                        )}
                                    >
                                        {step.index} {step.label}
                                    </div>
                                    <div className="text-xl text-neutral-100">{step.title}</div>
                                    <p className="text-sm leading-relaxed text-neutral-400">
                                        {step.description}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
