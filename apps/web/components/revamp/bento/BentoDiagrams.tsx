"use client";

import { motion, useReducedMotion } from "motion/react";
import { draw, fade, POP_ORIGIN, pop } from "../diagramMotion";

function DiagramScene({ children }: { children: React.ReactNode }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 280 200"
            className="h-full w-full font-mono"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
        >
            {children}
        </motion.svg>
    );
}

const GRID_COLS = 12;
const GRID_ROWS = 8;
const GRID_PITCH = 20;
const GRID_ORIGIN = { x: 30, y: 30 };

const ISSUE_CELLS = [
    { col: 2, row: 1, stroke: "#525252", delay: 0.45 },
    { col: 8, row: 1, stroke: "#737373", delay: 0.6 },
    { col: 4, row: 3, stroke: "#e5e5e5", delay: 0.9 },
    { col: 10, row: 4, stroke: "#737373", delay: 0.75 },
    { col: 1, row: 5, stroke: "#737373", delay: 0.55 },
    { col: 6, row: 6, stroke: "#525252", delay: 0.7 },
];

const GRID_DOTS = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => ({
    col: i % GRID_COLS,
    row: Math.floor(i / GRID_COLS),
})).filter((dot) => !ISSUE_CELLS.some((cell) => cell.col === dot.col && cell.row === dot.row));

function cellCenter(col: number, row: number) {
    return { x: GRID_ORIGIN.x + col * GRID_PITCH, y: GRID_ORIGIN.y + row * GRID_PITCH };
}

export function BoardDiagram() {
    return (
        <DiagramScene>
            <defs>
                <radialGradient id="bento-board-fade" cx="0.5" cy="0.5" r="0.7">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.6" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                </radialGradient>
                <mask id="bento-board-mask">
                    <rect width={280} height={200} fill="url(#bento-board-fade)" />
                </mask>
            </defs>
            {ISSUE_CELLS.map((cell) => {
                const { x, y } = cellCenter(cell.col, cell.row);
                return (
                    <motion.rect
                        key={`${cell.col}-${cell.row}`}
                        variants={pop(cell.delay)}
                        className={POP_ORIGIN}
                        x={x - 4}
                        y={y - 4}
                        width={16}
                        height={16}
                        rx={1.5}
                        fill="none"
                        stroke={cell.stroke}
                        strokeWidth={1.2}
                    />
                );
            })}
        </DiagramScene>
    );
}

const BURST_CENTER = { x: 140, y: 100 };
const BURST_ANGLES = Array.from({ length: 16 }, (_, i) => (i * 2 * Math.PI) / 16);
const BURST_RINGS = [
    { from: 16, to: 30, stroke: "#a3a3a3", opacity: 0.9, delay: 0.25 },
    { from: 42, to: 52, stroke: "#737373", opacity: 0.6, delay: 0.45 },
    { from: 62, to: 70, stroke: "#525252", opacity: 0.35, delay: 0.65 },
];

export function AgentDiagram() {
    return (
        <DiagramScene>
            {BURST_RINGS.map((ring) => (
                <motion.g key={ring.from} variants={fade(ring.delay)}>
                    {BURST_ANGLES.map((angle) => (
                        <line
                            key={angle}
                            x1={BURST_CENTER.x + Math.cos(angle) * ring.from}
                            y1={BURST_CENTER.y + Math.sin(angle) * ring.from}
                            x2={BURST_CENTER.x + Math.cos(angle) * ring.to}
                            y2={BURST_CENTER.y + Math.sin(angle) * ring.to}
                            stroke={ring.stroke}
                            strokeOpacity={ring.opacity}
                            strokeWidth={1.2}
                            strokeLinecap="round"
                        />
                    ))}
                </motion.g>
            ))}
            <motion.circle
                variants={pop(0.15)}
                className={POP_ORIGIN}
                cx={BURST_CENTER.x}
                cy={BURST_CENTER.y}
                r={2.5}
                fill="#e5e5e5"
            />
        </DiagramScene>
    );
}

const RUNNER_BARS = [
    { x: 20, y1: 48, y2: 84 },
    { x: 40, y1: 92, y2: 150 },
    { x: 60, y1: 36, y2: 92 },
    { x: 80, y1: 104, y2: 168 },
    { x: 100, y1: 70, y2: 126 },
    { x: 120, y1: 30, y2: 72 },
    { x: 140, y1: 96, y2: 158, bright: true },
    { x: 160, y1: 56, y2: 112 },
    { x: 180, y1: 32, y2: 96 },
    { x: 200, y1: 102, y2: 148 },
    { x: 220, y1: 60, y2: 118 },
    { x: 240, y1: 26, y2: 80 },
    { x: 260, y1: 94, y2: 164 },
];

export function RunnerDiagram() {
    return (
        <DiagramScene>
            {RUNNER_BARS.map((bar, i) => (
                <motion.line
                    key={bar.x}
                    variants={draw(0.2 + i * 0.05, 0.35)}
                    x1={bar.x}
                    y1={bar.y1}
                    x2={bar.x}
                    y2={bar.y2}
                    stroke={bar.bright ? "#e5e5e5" : "#a3a3a3"}
                    strokeOpacity={bar.bright ? 1 : 0.7}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                />
            ))}
        </DiagramScene>
    );
}

const TICK_RING = { cx: 168, cy: 100, inner: 52.5, outer: 59 };
const TICK_ANGLES = Array.from({ length: 40 }, (_, i) => (i * 2 * Math.PI) / 40);

export function MergeDiagram() {
    return (
        <DiagramScene>
            <motion.line
                variants={fade(0.1)}
                x1={0}
                y1={100}
                x2={280}
                y2={100}
                stroke="#333333"
                strokeWidth={1}
                strokeDasharray="3 6"
                strokeLinecap="round"
            />
            <motion.circle
                variants={fade(0.3)}
                cx={6}
                cy={100}
                r={34}
                fill="none"
                stroke="#262626"
                strokeWidth={1}
            />
            <motion.circle
                variants={fade(0.3)}
                cx={278}
                cy={100}
                r={44}
                fill="none"
                stroke="#262626"
                strokeWidth={1}
            />
            <motion.circle
                variants={fade(0.2)}
                cx={TICK_RING.cx}
                cy={TICK_RING.cy}
                r={70}
                fill="none"
                stroke="#262626"
                strokeWidth={1}
            />
            <motion.circle
                variants={draw(0.35, 0.7)}
                cx={84}
                cy={100}
                r={46}
                fill="none"
                stroke="#333333"
                strokeWidth={1}
            />
            {TICK_ANGLES.map((angle, i) => (
                <motion.line
                    key={angle}
                    variants={fade(0.55 + i * 0.012)}
                    x1={TICK_RING.cx + Math.cos(angle) * TICK_RING.inner}
                    y1={TICK_RING.cy + Math.sin(angle) * TICK_RING.inner}
                    x2={TICK_RING.cx + Math.cos(angle) * TICK_RING.outer}
                    y2={TICK_RING.cy + Math.sin(angle) * TICK_RING.outer}
                    stroke="#d4d4d4"
                    strokeOpacity={0.85}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                />
            ))}
            <motion.circle
                variants={pop(1.1)}
                className={POP_ORIGIN}
                cx={130}
                cy={100}
                r={2.5}
                fill="#737373"
            />
            <motion.text
                variants={fade(0.95)}
                x={84}
                y={91}
                fontSize={7}
                textAnchor="middle"
                fill="#525252"
            >
                issue
            </motion.text>
            <motion.text
                variants={fade(1.05)}
                x={TICK_RING.cx}
                y={91}
                fontSize={7}
                textAnchor="middle"
                fill="#525252"
            >
                merged
            </motion.text>
        </DiagramScene>
    );
}
