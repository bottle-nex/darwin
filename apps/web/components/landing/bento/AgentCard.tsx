"use client";

import { motion, useReducedMotion } from "motion/react";

import { drop } from "../diagramMotion";
import BentoCard from "./BentoCard";

/** Standard 30° isometric projection: +u runs down-right, +v runs down-left. */
const ISO = "matrix(0.866 0.5 -0.866 0.5 0 0)";
const SQ = Math.SQRT1_2;

const SLAB_FILL = "#ffffff";
const TOP_STROKE = "#a3a3a3";
const SIDE_STROKE = "#d4d4d4";
const DETAIL_STROKE = "#b8b8b8";

function isoX(u: number, v: number) {
    return 0.866 * (u - v);
}

function isoY(u: number, v: number) {
    return 0.5 * (u + v);
}

type SlabProps = {
    u: number;
    v: number;
    w: number;
    h: number;
    r: number;
    depth: number;
    delay: number;
    children?: React.ReactNode;
};

/**
 * A rounded slab drawn in the iso plane: a filled bottom face, the two vertical
 * silhouette edges, and a filled top face carrying the engraved details.
 */
function IsoSlab({ u, v, w, h, r, depth, delay, children }: SlabProps) {
    const reduceMotion = useReducedMotion();
    const leftU = u + r - r * SQ;
    const leftV = v + h - r + r * SQ;
    const rightU = u + w - r + r * SQ;
    const rightV = v + r - r * SQ;
    const lx = isoX(leftU, leftV);
    const ly = isoY(leftU, leftV);
    const rx = isoX(rightU, rightV);
    const ry = isoY(rightU, rightV);

    return (
        <motion.g variants={drop(delay, 0.7)} whileHover={reduceMotion ? undefined : "lifted"}>
            <motion.g
                variants={{ lifted: { y: -7 } }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <g transform={`translate(0 ${depth})`}>
                    <g transform={ISO}>
                        <rect
                            x={u}
                            y={v}
                            width={w}
                            height={h}
                            rx={r}
                            fill={SLAB_FILL}
                            stroke={SIDE_STROKE}
                            strokeWidth={1.1}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                </g>
                <line
                    x1={lx}
                    y1={ly}
                    x2={lx}
                    y2={ly + depth}
                    stroke={SIDE_STROKE}
                    strokeWidth={1.1}
                />
                <line
                    x1={rx}
                    y1={ry}
                    x2={rx}
                    y2={ry + depth}
                    stroke={SIDE_STROKE}
                    strokeWidth={1.1}
                />
                <g transform={ISO}>
                    <rect
                        x={u}
                        y={v}
                        width={w}
                        height={h}
                        rx={r}
                        fill={SLAB_FILL}
                        stroke={TOP_STROKE}
                        strokeWidth={1.1}
                        vectorEffect="non-scaling-stroke"
                    />
                    {children}
                </g>
            </motion.g>
        </motion.g>
    );
}

/** Kanban columns engraved on the left slab — the board the issues land on. */
function BoardDetail() {
    return (
        <g fill="none" stroke={DETAIL_STROKE} strokeWidth={1}>
            <rect
                x={-74}
                y={26}
                width={11}
                height={38}
                rx={3.5}
                vectorEffect="non-scaling-stroke"
            />
            <rect
                x={-59}
                y={34}
                width={11}
                height={46}
                rx={3.5}
                vectorEffect="non-scaling-stroke"
            />
            <rect
                x={-44}
                y={20}
                width={11}
                height={34}
                rx={3.5}
                vectorEffect="non-scaling-stroke"
            />
        </g>
    );
}

/** The DarwinLogo mark (792×460 viewBox) engraved on the top slab — the agent itself. */
const DARWIN_MARK =
    "M626.9 24.4L657 40.8L657 215.5L759.9 147L792 164.5L792 438.5L657 438.5L657 214.6L328.7 447.2L328.7 227.2L0 460.1L0 235.9L297.9 37.4L328.7 54.2L328.7 223Z";

function AgentDetail() {
    return (
        <g fill="none" stroke={DETAIL_STROKE} strokeWidth={1}>
            <g transform="translate(2 -90) scale(0.062) translate(-396 -230)">
                <path d={DARWIN_MARK} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
            <line x1={-30} y1={-54} x2={34} y2={-54} vectorEffect="non-scaling-stroke" />
        </g>
    );
}

/** Branch-and-merge trace plus a runner terminal — the fix proven and shipped. */
function PipelineDetail() {
    return (
        <g fill="none" stroke={DETAIL_STROKE} strokeWidth={1}>
            <path d="M14 40h78" vectorEffect="non-scaling-stroke" />
            <path d="M30 40c0-14 6-22 18-22h14c12 0 18 8 18 22" vectorEffect="non-scaling-stroke" />
            <circle cx={30} cy={40} r={3.5} fill={SLAB_FILL} vectorEffect="non-scaling-stroke" />
            <circle cx={55} cy={18} r={3.5} fill={SLAB_FILL} vectorEffect="non-scaling-stroke" />
            <circle cx={80} cy={40} r={3.5} fill={SLAB_FILL} vectorEffect="non-scaling-stroke" />
            <rect x={104} y={14} width={28} height={28} rx={7} vectorEffect="non-scaling-stroke" />
            <path
                d="M111 21l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <line
                x1={121}
                y1={35}
                x2={127}
                y2={35}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </g>
    );
}

function DevicesScene() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 280 240"
            preserveAspectRatio="xMidYMin slice"
            className="h-full w-full overflow-visible"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
        >
            <g transform="translate(134 82)">
                <IsoSlab u={-88} v={-8} w={64} h={104} r={14} depth={26} delay={0.15}>
                    <BoardDetail />
                    <rect
                        x={-82}
                        y={6}
                        width={24}
                        height={7}
                        rx={3.5}
                        fill="none"
                        stroke={DETAIL_STROKE}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                    />
                </IsoSlab>
                <IsoSlab u={-30} v={-160} w={64} h={150} r={14} depth={34} delay={0.3}>
                    <AgentDetail />
                </IsoSlab>
                <IsoSlab u={2} v={0} w={170} h={66} r={14} depth={18} delay={0.45}>
                    <PipelineDetail />
                </IsoSlab>
            </g>
        </motion.svg>
    );
}

/** Faint isometric diamond grid washing across the whole card, fading at the edges. */
function IsoGridBackdrop() {
    return (
        <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full rounded-[10px]"
        >
            <defs>
                <pattern
                    id="agent-iso-grid"
                    width={96}
                    height={55.4256}
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M0 0L96 55.4256M0 55.4256L96 0"
                        stroke="#e7e7ea"
                        strokeWidth={1}
                        fill="none"
                    />
                </pattern>
                <radialGradient id="agent-grid-fade" cx="0.5" cy="0.42" r="0.75">
                    <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
                    <stop offset="0.6" stopColor="#ffffff" stopOpacity={0.5} />
                    <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                </radialGradient>
                <mask id="agent-grid-mask">
                    <rect width="100%" height="100%" fill="url(#agent-grid-fade)" />
                </mask>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill="url(#agent-iso-grid)"
                mask="url(#agent-grid-mask)"
            />
        </svg>
    );
}

export default function AgentCard({ lit, litDelay }: { lit: boolean; litDelay: number }) {
    return (
        <BentoCard
            lit={lit}
            litDelay={litDelay}
            label="Agent"
            description="An agent claims each card off the board and works the fix"
            clip={false}
            diagram={
                <>
                    <IsoGridBackdrop />
                    <div className="relative z-10 -mx-5 -mt-5 h-[calc(100%+1.25rem)] [clip-path:inset(0)] md:-mx-6 md:-mt-6 md:h-[calc(100%+1.5rem)] md:[clip-path:inset(1px_1px_0_-64px)]">
                        <DevicesScene />
                    </div>
                </>
            }
        />
    );
}
