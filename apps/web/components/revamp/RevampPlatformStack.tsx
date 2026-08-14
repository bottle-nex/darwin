"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { IconType } from "react-icons";
import { LuSquareKanban, LuSquareTerminal } from "react-icons/lu";
import { cn } from "@/lib/utils";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import Reveal from "../utility/Reveal";
import LandingSection from "./LandingSection";
import IsoChip, { DEPTH, HALF_H, HALF_W } from "./stack/IsoChip";

const CHIP_X = 310;
const GUIDE_XS = [210, 294, 326, 410];
const BOARD_Y = 150;
const AGENT_Y = 400;
const RUNNER_Y = 650;

/** Clearance between a guide segment's end and a chip's outline (covers the float drift). */
const GUIDE_MARGIN = 16;

/**
 * The dashed guides only span the gaps between chips. Each chip's silhouette at the
 * guide's x-offset is the top-face edge (±edge) plus DEPTH on the underside.
 */
function guideSegments(guideX: number) {
    const edge = HALF_H * (1 - Math.abs(guideX - CHIP_X) / HALF_W);
    const below = (chipY: number) => chipY + DEPTH + edge + GUIDE_MARGIN;
    const above = (chipY: number) => chipY - edge - GUIDE_MARGIN;
    return [
        { y1: below(BOARD_Y), y2: above(AGENT_Y) },
        { y1: below(AGENT_Y), y2: above(RUNNER_Y) },
    ];
}

type GhostLayerId = "board" | "runner";

type GhostLayer = {
    id: GhostLayerId;
    icon: IconType;
    title: string;
    description: string;
};

const BOARD_LAYER: GhostLayer = {
    id: "board",
    icon: LuSquareKanban,
    title: "The board",
    description:
        "Teams drop issues onto a shared canvas. Every card carries the repo, the scope, and what done looks like — the full context an agent needs to start.",
};

const RUNNER_LAYER: GhostLayer = {
    id: "runner",
    icon: LuSquareTerminal,
    title: "Code runners",
    description:
        "Sandboxed, ephemeral compute clones your project and actually runs it — build, test, validate — so nothing ships on faith.",
};

function fade(delay: number) {
    return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay, duration: 0.5 } },
    };
}

function BoardGlyph() {
    return (
        <g fill="currentColor">
            <rect x={-32} y={-18} width={18} height={44} rx={4} />
            <rect x={-9} y={-4} width={18} height={30} rx={4} />
            <rect x={14} y={-26} width={18} height={52} rx={4} />
        </g>
    );
}

/** The MatchaLogo mark (792×460 viewBox) scaled and centered into the chip-face glyph box. */
function MatchaGlyph() {
    return (
        <g
            transform="rotate(-90) scale(0.078) translate(-396 -230)"
            fill="currentColor"
            fillRule="evenodd"
        >
            <path d="M626.9 24.4L657 40.8L657 215.5L759.9 147L792 164.5L792 438.5L657 438.5L657 214.6L328.7 447.2L328.7 227.2L0 460.1L0 235.9L297.9 37.4L328.7 54.2L328.7 223Z" />
        </g>
    );
}

function RunnerGlyph() {
    return (
        <g
            transform="rotate(-90)"
            stroke="currentColor"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        >
            <path d="M-26 -16 L-8 0 L-26 16" />
            <path d="M2 18 H26" />
        </g>
    );
}

function GhostLayerBlock({
    layer,
    onHoverChange,
    className,
}: {
    layer: GhostLayer;
    onHoverChange: (id: GhostLayerId | null) => void;
    className?: string;
}) {
    const Icon = layer.icon;

    return (
        <div
            onMouseEnter={() => onHoverChange(layer.id)}
            onMouseLeave={() => onHoverChange(null)}
            className={cn(
                "group flex flex-1 flex-col p-8 transition-colors duration-300 hover:bg-white/2 md:p-10",
                className,
            )}
        >
            <div>
                <Icon
                    className="size-4 text-neutral-500 transition-colors duration-300 group-hover:text-neutral-200"
                    strokeWidth={1.5}
                />
                <h3 className="mt-5 text-sm font-medium tracking-[0.18em] text-neutral-400 uppercase transition-colors duration-300 group-hover:text-snow">
                    {layer.title}
                </h3>
                <p className="mt-4 max-w-70 text-[0.8125rem] leading-relaxed text-neutral-600 transition-colors duration-300 group-hover:text-neutral-400">
                    {layer.description}
                </p>
            </div>
        </div>
    );
}

function StackDiagram({ highlighted }: { highlighted: GhostLayerId | null }) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            role="img"
            aria-label="Exploded view of the matcha stack: the board, the agent, and code runners"
            viewBox="0 0 620 800"
            className="mx-auto block w-full max-w-125"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
        >
            {GUIDE_XS.map((guideX, i) =>
                guideSegments(guideX).map(({ y1, y2 }, segment) => (
                    <motion.line
                        key={`${guideX}-${segment}`}
                        x1={guideX}
                        y1={y1}
                        x2={guideX}
                        y2={y2}
                        stroke="#39393d"
                        strokeWidth={1}
                        strokeDasharray="4 7"
                        variants={fade(0.55 + i * 0.08)}
                    />
                )),
            )}

            <IsoChip
                variant="ghost"
                x={CHIP_X}
                y={BOARD_Y}
                glyph={<BoardGlyph />}
                highlighted={highlighted === "board"}
                ghostOpacity={0.45}
                entranceOffsetY={110}
                float={{ amplitude: 10, duration: 6, delay: 0.3 }}
            />
            <IsoChip
                variant="ghost"
                x={CHIP_X}
                y={RUNNER_Y}
                glyph={<RunnerGlyph />}
                highlighted={highlighted === "runner"}
                ghostOpacity={0.65}
                entranceOffsetY={-110}
                float={{ amplitude: 10, duration: 6.6, delay: 1.2 }}
            />
            <IsoChip
                variant="active"
                x={CHIP_X}
                y={AGENT_Y}
                glyph={<MatchaGlyph />}
                float={{ amplitude: 6, duration: 5.2, delay: 0 }}
            />

            <motion.g variants={fade(1)} className="max-md:hidden">
                <rect x={462} y={396.5} width={7} height={7} fill="#a3a3a3" />
                <line x1={472} y1={400} x2={620} y2={400} stroke="#39393d" strokeWidth={1} />
            </motion.g>
        </motion.svg>
    );
}

export default function RevampPlatformStack() {
    const [highlighted, setHighlighted] = useState<GhostLayerId | null>(null);

    return (
        <LandingSection>
            <Reveal>
                <p className="max-w-4xl indent-24 text-[2.5rem] leading-tight tracking-tight">
                    <span className="text-snow">One machine, assembled in layers. </span>
                    <span className="text-neutral-500">
                        The board collects the work, an agent carries it, and sandboxed runners
                        prove it. Pull the stack apart and every layer clicks into the next.
                    </span>
                </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-16">
                <div className="grid grid-cols-1 border border-white/5 rounded-[10px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1fr)]">
                    <div className="flex flex-col max-md:border-b max-md:border-white/5 md:border-r md:border-white/5">
                        <GhostLayerBlock
                            layer={BOARD_LAYER}
                            onHoverChange={setHighlighted}
                            className="border-b border-white/5"
                        />
                        <GhostLayerBlock
                            layer={RUNNER_LAYER}
                            onHoverChange={setHighlighted}
                            className="justify-end"
                        />
                    </div>

                    <figure className="order-first px-4 py-10 md:order-0 md:px-6 md:py-8">
                        <StackDiagram highlighted={highlighted} />
                    </figure>

                    <aside className="relative flex items-center p-8 max-md:border-t max-md:border-white/5 md:p-10 md:pl-6">
                        <span
                            aria-hidden
                            className="absolute inset-y-0 left-8 w-px bg-white/5 md:left-6"
                        />
                        <div className="relative flex-1 pl-10">
                            <span
                                aria-hidden
                                className="absolute -top-4 -right-8 left-0 h-px bg-white/5 md:-right-10"
                            />
                            <span
                                aria-hidden
                                className="absolute -right-8 -bottom-4 left-0 h-px bg-white/5 md:-right-10"
                            />
                            <span
                                aria-hidden
                                className="absolute -inset-y-4 -left-px w-0.5 rounded-full bg-primary"
                            />
                            <HeroBuddy className="size-6 -my-1" move={false} />
                            <h3 className="mt-5 text-base font-medium tracking-[0.16em] text-snow uppercase">
                                The agent works it
                            </h3>
                            <p className="mt-4 max-w-sm text-[0.8125rem] leading-relaxed text-neutral-400">
                                An agent claims the card and reads your repo before touching a line
                                — your conventions, your structure, the blast radius of the change.
                                It writes the fix the way your team would, proves it on a runner,
                                and comes back with a pull request.
                            </p>
                        </div>
                    </aside>
                </div>
            </Reveal>
        </LandingSection>
    );
}
