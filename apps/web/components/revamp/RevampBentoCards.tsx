"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import Reveal from "../utility/Reveal";
import AgentCard from "./bento/AgentCard";
import BoardCard from "./bento/BoardCard";
import PullRequestCard from "./bento/PullRequestCard";
import RunnerCard from "./bento/RunnerCard";

const CARDS_SETTLED_MS = 900;
const LIGHT_STAGGER_MS = 150;

const CARDS = [BoardCard, AgentCard, RunnerCard, PullRequestCard];

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
                        works.
                    </span>
                </p>
                <div className="relative mt-10">
                    <ProcessConnectors />
                    <div
                        ref={rowRef}
                        className="relative grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-3 md:pt-13 md:pb-12"
                    >
                        {CARDS.map((Card, i) => (
                            <Reveal
                                key={Card.name}
                                delay={i * 0.1}
                                className={i % 2 === 1 ? "md:mt-18" : undefined}
                            >
                                <Card
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
