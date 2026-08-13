"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import Reveal from "../utility/Reveal";

const CARDS_SETTLED_MS = 900;
const LIGHT_STAGGER_MS = 150;

type ProcessStep = {
    number: string;
    title: string;
    description: string;
    surface: string;
};

const PROCESS_STEPS: ProcessStep[] = [
    {
        number: "1",
        title: "File an issue",
        description:
            "Drop it on the board your team already plans on. Scope it the way you'd brief a teammate: what's broken, what good looks like, and anything the code won't tell you on its own.",
        surface: "bg-white/2",
    },
    {
        number: "2",
        title: "An agent claims it",
        description:
            "It pulls the card and reads the repo before touching a single line, learning your conventions, your structure, and the blast radius of the change. Then it plans the work.",
        surface: "bg-white/6",
    },
    {
        number: "3",
        title: "The work gets verified",
        description:
            "Sandboxed compute clones your project and makes the change against the real thing. The build runs. The tests run. Nothing moves forward until they pass.",
        surface: "bg-white/2",
    },
    {
        number: "4",
        title: "You review the PR",
        description:
            "The diff and the reasoning land in your repo as a pull request. Approve it, or send it back with notes. Nothing merges itself.",
        surface: "bg-white/8",
    },
];

const CONNECTOR_PATHS = [
    "M149.5 436 V530 Q149.5 544 163.5 544 H446.5 Q460.5 544 460.5 530 V508",
    "M460.5 124 V26 Q460.5 12 474.5 12 H757.5 Q771.5 12 771.5 26 V52",
    "M771.5 436 V530 Q771.5 544 785.5 544 H1068.5 Q1082.5 544 1082.5 530 V508",
];

function fade(delay: number) {
    return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay, duration: 0.5 } },
    };
}

function ProcessConnectors() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 1232 556"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            {CONNECTOR_PATHS.map((path, i) => (
                <motion.path
                    key={path}
                    d={path}
                    fill="none"
                    stroke="#4a4a4a"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    variants={fade(0.25 + i * 0.2)}
                />
            ))}
        </motion.svg>
    );
}

function ProcessCard({
    step,
    className,
    lit,
    litDelay,
}: {
    step: ProcessStep;
    className?: string;
    lit: boolean;
    litDelay: number;
}) {
    return (
        <div
            style={{ "--lit-delay": `${litDelay}ms` } as CSSProperties}
            className={cn(
                "lit-edge relative flex h-full flex-col justify-between rounded-[10px] bg-linear-to-br from-white/5 to-transparent p-8 md:h-96",
                lit && "is-lit",
                className,
            )}
        >
            <span className="text-[2.25rem] leading-none font-light text-snow/70">
                {step.number}
            </span>
            <div>
                <h3 className="text-xl leading-snug text-snow">{step.title}</h3>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-neutral-500">
                    {step.description}
                </p>
            </div>
        </div>
    );
}

export default function RevampBentoCards() {
    const rowRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const rowInView = useInView(rowRef, { once: true, amount: 0.3 });
    const lit = Boolean(reduceMotion) || rowInView;

    return (
        <section className="w-full bg-ink pb-28">
            <div className="mx-auto w-full max-w-7xl px-6">
                <p className="max-w-4xl indent-24 text-[2.5rem] leading-tight tracking-tight">
                    <span className="text-snow">Four stages, every issue. </span>
                    <span className="text-neutral-500">
                        The board hands it off, an agent picks it up, a sandboxed runner proves it
                        works, and a pull request lands back with you.
                    </span>
                </p>
                <div className="relative mt-10">
                    <ProcessConnectors />
                    <div
                        ref={rowRef}
                        className="relative grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-3 md:pt-13 md:pb-12"
                    >
                        {PROCESS_STEPS.map((step, i) => (
                            <Reveal
                                key={step.number}
                                delay={i * 0.1}
                                className={i % 2 === 1 ? "md:mt-18" : undefined}
                            >
                                <ProcessCard
                                    step={step}
                                    className={step.surface}
                                    lit={lit}
                                    litDelay={CARDS_SETTLED_MS + i * LIGHT_STAGGER_MS}
                                />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
