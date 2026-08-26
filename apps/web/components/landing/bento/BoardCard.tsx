"use client";

import { motion, useReducedMotion } from "motion/react";

import { fade, POP_ORIGIN } from "../diagramMotion";
import BentoCard from "./BentoCard";
import DiagramScene from "./DiagramScene";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Hovering the scene slides a plug half the last few px into contact. */
function connect(toX: number) {
    return {
        variants: { connected: { x: toX } },
        transition: { duration: 0.5, ease: EASE_OUT },
    };
}

/** The two halves slide toward each other but stop just short of connecting. */
function slideIn(delay: number, fromX: number) {
    return {
        hidden: { opacity: 0, x: fromX },
        visible: { opacity: 1, x: 0, transition: { delay, duration: 0.8, ease: EASE_OUT } },
    };
}

/** Faint circuit-board traces behind the plugs; each ends in a solder-pad dot. */
const CIRCUIT_TRACES = [
    { d: "M16 34 H78 V56", dot: { x: 16, y: 34 } },
    { d: "M112 14 V34", dot: { x: 112, y: 14 } },
    { d: "M262 44 H216 V24", dot: { x: 262, y: 44 } },
    { d: "M58 166 H92 V184", dot: { x: 58, y: 166 } },
    { d: "M256 126 V148 H230", dot: { x: 256, y: 126 } },
];
const CIRCUIT_DOTS = [
    { x: 86, y: 26 },
    { x: 172, y: 30 },
    { x: 246, y: 72 },
    { x: 24, y: 108 },
    { x: 206, y: 186 },
];
const CIRCUIT_SQUARES = [
    { x: 70, y: 44, size: 5 },
    { x: 222, y: 52, size: 4 },
];
const COMB_TOP = Array.from({ length: 10 }, (_, i) => 204 + i * 3.5);
const COMB_BOTTOM = Array.from({ length: 4 }, (_, i) => 18 + i * 4);

const CABLE_LEFT = "M82 88 C60 88 48 97 42 117 C36 137 26 158 6 176";
const CABLE_RIGHT = "M198 88 C220 88 232 97 238 117 C244 137 254 158 274 176";

function Cable({ d }: { d: string }) {
    return (
        <>
            <path d={d} fill="none" stroke="#2b2b2b" strokeWidth={7} strokeLinecap="round" />
            <path
                d={d}
                fill="none"
                stroke="#4a4a4a"
                strokeWidth={1.6}
                strokeOpacity={0.6}
                strokeLinecap="round"
                transform="translate(0 -1.6)"
            />
        </>
    );
}

export default function BoardCard({ lit, litDelay }: { lit: boolean; litDelay: number }) {
    const reduceMotion = useReducedMotion();

    return (
        <BentoCard
            lit={lit}
            litDelay={litDelay}
            label="Board"
            description="Connect your GitHub and every issue lands on a shared board"
            diagram={
                <div className="relative h-full w-full">
                    <DiagramScene hover="connected">
                        <defs>
                            <linearGradient id="board-plug-body" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#5d5d5d" />
                                <stop offset="0.45" stopColor="#464646" />
                                <stop offset="1" stopColor="#333333" />
                            </linearGradient>
                            <linearGradient id="board-prong" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#c2c2c2" />
                                <stop offset="1" stopColor="#7c7c7c" />
                            </linearGradient>
                            <linearGradient id="board-face" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor="#6a6a6a" />
                                <stop offset="1" stopColor="#3d3d3d" />
                            </linearGradient>
                            <radialGradient id="board-glow" cx="0.5" cy="0.5" r="0.5">
                                <stop offset="0" stopColor="#ffffff" stopOpacity={0.07} />
                                <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                            </radialGradient>
                        </defs>

                        <motion.g variants={fade(0.1)}>
                            <g stroke="#242424" strokeWidth={1} fill="none">
                                {CIRCUIT_TRACES.map((trace) => (
                                    <path key={trace.d} d={trace.d} />
                                ))}
                                {COMB_TOP.map((x) => (
                                    <line key={x} x1={x} y1={14} x2={x} y2={24} strokeWidth={1.5} />
                                ))}
                                {COMB_BOTTOM.map((x) => (
                                    <line
                                        key={x}
                                        x1={x}
                                        y1={184}
                                        x2={x}
                                        y2={190}
                                        strokeWidth={1.5}
                                    />
                                ))}
                                {CIRCUIT_SQUARES.map((square) => (
                                    <rect
                                        key={`${square.x}-${square.y}`}
                                        x={square.x}
                                        y={square.y}
                                        width={square.size}
                                        height={square.size}
                                    />
                                ))}
                            </g>
                            {CIRCUIT_TRACES.map((trace) => (
                                <circle
                                    key={trace.d}
                                    cx={trace.dot.x}
                                    cy={trace.dot.y}
                                    r={1.8}
                                    fill="#383838"
                                />
                            ))}
                            {CIRCUIT_DOTS.map((dot) => (
                                <circle
                                    key={`${dot.x}-${dot.y}`}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={1.2}
                                    fill="#383838"
                                />
                            ))}
                        </motion.g>

                        <motion.g variants={fade(0.25)}>
                            <motion.g
                                className={POP_ORIGIN}
                                style={{ opacity: 0.75 }}
                                variants={{ connected: { opacity: 1, scale: 1.15 } }}
                                transition={{ duration: 0.5, ease: EASE_OUT }}
                            >
                                <circle cx={140} cy={88} r={85} fill="url(#board-glow)" />
                            </motion.g>
                        </motion.g>

                        {/* Male plug: cable, strain relief, tapered body, vents, two prongs. */}
                        <motion.g variants={slideIn(0.35, -16)}>
                            <motion.g {...connect(7)}>
                                <Cable d={CABLE_LEFT} />
                                <rect x={74} y={81} width={16} height={14} rx={6} fill="#333333" />
                                <path
                                    d="M94 77.5 L112 72.5 Q118 71 118 76.5 V99.5 Q118 105 112 103.5 L94 98.5 Q89 97.2 89 93.5 V82.5 Q89 78.8 94 77.5 Z"
                                    fill="url(#board-plug-body)"
                                    stroke="#262626"
                                    strokeWidth={0.8}
                                />
                                {[97, 100.5, 104, 107.5].map((x) => (
                                    <line
                                        key={x}
                                        x1={x}
                                        y1={81}
                                        x2={x}
                                        y2={95}
                                        stroke="#282828"
                                        strokeWidth={1}
                                    />
                                ))}
                                <line
                                    x1={116}
                                    y1={75}
                                    x2={116}
                                    y2={101}
                                    stroke="#757575"
                                    strokeWidth={1.2}
                                    strokeOpacity={0.55}
                                    strokeLinecap="round"
                                />
                                <rect
                                    x={118}
                                    y={79.5}
                                    width={19}
                                    height={4.5}
                                    rx={1.5}
                                    fill="url(#board-prong)"
                                />
                                <rect
                                    x={118}
                                    y={91}
                                    width={19}
                                    height={4.5}
                                    rx={1.5}
                                    fill="url(#board-prong)"
                                />
                                <circle cx={132.5} cy={81.75} r={1} fill="#5a5a5a" />
                                <circle cx={132.5} cy={93.25} r={1} fill="#5a5a5a" />
                            </motion.g>
                        </motion.g>

                        {/* Female socket: face plate with dark slot, tapered body, cable out the back. */}
                        <motion.g variants={slideIn(0.35, 16)}>
                            <motion.g {...connect(-7)}>
                                <Cable d={CABLE_RIGHT} />
                                <rect x={190} y={81} width={16} height={14} rx={6} fill="#333333" />
                                <path
                                    d="M186 77.5 L164 72 Q158 70.5 158 76 V100 Q158 105.5 164 104 L186 98.5 Q191 97.2 191 93.5 V82.5 Q191 78.8 186 77.5 Z"
                                    fill="url(#board-plug-body)"
                                    stroke="#262626"
                                    strokeWidth={0.8}
                                />
                                {[166, 170, 174, 178].map((x) => (
                                    <line
                                        key={x}
                                        x1={x}
                                        y1={80}
                                        x2={x}
                                        y2={96}
                                        stroke="#282828"
                                        strokeWidth={1}
                                    />
                                ))}
                                <rect
                                    x={149}
                                    y={66}
                                    width={10}
                                    height={44}
                                    rx={4.5}
                                    fill="url(#board-face)"
                                    stroke="#262626"
                                    strokeWidth={0.8}
                                />
                                <rect x={149} y={74} width={2} height={28} rx={1} fill="#161616" />
                            </motion.g>
                        </motion.g>
                    </DiagramScene>
                    <div className="pointer-events-none absolute inset-x-0 bottom-[20%] flex justify-center scale-95">
                        <motion.div
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{
                                delay: 0.9,
                                type: "spring",
                                bounce: 0.35,
                                duration: 0.6,
                            }}
                            className="rounded-[6px] border border-[#3f3f3f] bg-graphite px-3 py-0.5 font-mono text-[11px] whitespace-nowrap text-neutral-300"
                        >
                            Connect your GitHub
                        </motion.div>
                    </div>
                </div>
            }
        />
    );
}
