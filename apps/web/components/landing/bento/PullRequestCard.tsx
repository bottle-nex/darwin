"use client";

import { motion, useReducedMotion } from "motion/react";

import { drop, fade, pop, POP_ORIGIN } from "../diagramMotion";
import BentoCard from "./BentoCard";

/** Standard 30° isometric projection: +u runs down-right, +v runs down-left. */
const ISO = "matrix(0.866 0.5 -0.866 0.5 0 0)";
const SQ = Math.SQRT1_2;

/** The darwin mark, verbatim from AppLogo (viewBox 792x460). */
const DARWIN_MARK =
    "M626.9 24.4L657 40.8L657 215.5L759.9 147L792 164.5L792 438.5L657 438.5L657 214.6L328.7 447.2L328.7 227.2L0 460.1L0 235.9L297.9 37.4L328.7 54.2L328.7 223Z";

const SLAB_FILL = "#ffffff";
const BELT_FILL = "#f7f7f8";
const TOP_STROKE = "#a3a3a3";
const SIDE_STROKE = "#d4d4d4";
const DETAIL_STROKE = "#b8b8b8";
const BRIGHT = "#808080";

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

/** A rounded slab in the iso plane: bottom face, silhouette edges, detailed top face. */
function IsoSlab({ u, v, w, h, r, depth, delay, children }: SlabProps) {
    const leftU = u + r - r * SQ;
    const leftV = v + h - r + r * SQ;
    const rightU = u + w - r + r * SQ;
    const rightV = v + r - r * SQ;
    const lx = isoX(leftU, leftV);
    const ly = isoY(leftU, leftV);
    const rx = isoX(rightU, rightV);
    const ry = isoY(rightU, rightV);

    return (
        <motion.g variants={drop(delay, 0.7)}>
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
            <line x1={lx} y1={ly} x2={lx} y2={ly + depth} stroke={SIDE_STROKE} strokeWidth={1.1} />
            <line x1={rx} y1={ry} x2={rx} y2={ry + depth} stroke={SIDE_STROKE} strokeWidth={1.1} />
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
    );
}

/** A round platform riding the belt: a circle in the iso plane projects to a 1.22r x 0.71r ellipse. */
function Puck({
    x,
    y,
    r,
    depth,
    delay,
    children,
}: {
    x: number;
    y: number;
    r: number;
    depth: number;
    delay: number;
    children?: React.ReactNode;
}) {
    const rx = r * 1.2247;
    const ry = r * 0.7071;

    return (
        <motion.g variants={drop(delay, 0.7)}>
            <g className="transition-transform duration-700 ease-out group-hover:-translate-x-[7px] group-hover:translate-y-1">
                <g transform={`translate(${x} ${y})`}>
                    <ellipse
                        cy={depth}
                        rx={rx}
                        ry={ry}
                        fill={SLAB_FILL}
                        stroke={SIDE_STROKE}
                        strokeWidth={1.1}
                    />
                    <line
                        x1={-rx}
                        y1={0}
                        x2={-rx}
                        y2={depth}
                        stroke={SIDE_STROKE}
                        strokeWidth={1.1}
                    />
                    <line
                        x1={rx}
                        y1={0}
                        x2={rx}
                        y2={depth}
                        stroke={SIDE_STROKE}
                        strokeWidth={1.1}
                    />
                    <ellipse
                        rx={rx}
                        ry={ry}
                        fill={SLAB_FILL}
                        stroke={TOP_STROKE}
                        strokeWidth={1.1}
                    />
                    {children}
                </g>
            </g>
        </motion.g>
    );
}

/** Two engraved tick strokes inside a slot pill. */
function SlotTicks({ u, v }: { u: number; v: number }) {
    return (
        <g stroke={DETAIL_STROKE} strokeWidth={1} strokeLinecap="round">
            <line x1={u - 3} y1={v + 4} x2={u + 3} y2={v - 4} vectorEffect="non-scaling-stroke" />
            <line x1={u - 3} y1={v + 12} x2={u + 3} y2={v + 4} vectorEffect="non-scaling-stroke" />
        </g>
    );
}

function ConveyorScene() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            aria-hidden
            viewBox="0 0 280 360"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full font-mono"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
        >
            <g transform="translate(140 150)">
                {/* The belt: a long rounded band running corner to corner. */}
                <motion.g variants={fade(0.1)}>
                    <g transform="translate(0 10)">
                        <g transform={ISO}>
                            <rect
                                x={-42}
                                y={-320}
                                width={84}
                                height={640}
                                rx={32}
                                fill={BELT_FILL}
                                stroke={SIDE_STROKE}
                                strokeWidth={1.1}
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    </g>
                    <g transform={ISO}>
                        <rect
                            x={-42}
                            y={-320}
                            width={84}
                            height={640}
                            rx={32}
                            fill={BELT_FILL}
                            stroke={TOP_STROKE}
                            strokeWidth={1.1}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                </motion.g>

                {/* Upstream pucks rolling in from the top-right. */}
                <Puck x={128} y={-74} r={26} depth={8} delay={0.35}>
                    <g transform={ISO}>
                        <rect
                            x={-14}
                            y={-10}
                            width={22}
                            height={18}
                            rx={8}
                            fill={SLAB_FILL}
                            stroke={DETAIL_STROKE}
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                </Puck>
                <Puck x={84} y={-48} r={30} depth={9} delay={0.45}>
                    <g transform={ISO}>
                        <g transform="translate(-14.3 -8.3) scale(0.036)">
                            <path
                                d={DARWIN_MARK}
                                fill="#8e8e96"
                                className="transition-[fill] duration-500 group-hover:fill-[#808080]"
                            />
                        </g>
                    </g>
                </Puck>

                {/* The review station: slotted plate, floating capsule, magnifier coin. */}
                <IsoSlab u={-58} v={-50} w={116} h={100} r={24} depth={12} delay={0.25}>
                    <g fill="none" stroke={DETAIL_STROKE} strokeWidth={1}>
                        <rect
                            x={-46}
                            y={-35}
                            width={22}
                            height={70}
                            rx={11}
                            vectorEffect="non-scaling-stroke"
                        />
                        <rect
                            x={24}
                            y={-35}
                            width={22}
                            height={70}
                            rx={11}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                    <rect x={-11} y={-35} width={22} height={70} rx={11} fill="#ebebed" />
                    <SlotTicks u={-35} v={-24} />
                    <SlotTicks u={35} v={12} />
                    <SlotTicks u={0} v={16} />
                </IsoSlab>

                <motion.g variants={pop(0.75)} className={POP_ORIGIN}>
                    <g className="transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
                        <g transform="translate(0 -8)">
                            <g transform={ISO}>
                                <g transform="rotate(-90)">
                                    <rect
                                        x={-37}
                                        y={-12}
                                        width={74}
                                        height={24}
                                        rx={8}
                                        fill="#18181b"
                                        stroke="#a3a3a3"
                                    />
                                    <text
                                        x={0}
                                        y={3.5}
                                        fontSize={10}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                    >
                                        PR #142
                                    </text>
                                </g>
                            </g>
                        </g>
                    </g>
                </motion.g>

                <g transform="translate(-30 -78)">
                    <IsoSlab u={-15} v={-42} w={30} h={84} r={15} depth={9} delay={0.55}>
                        <g fill="none" stroke={DETAIL_STROKE} strokeWidth={1}>
                            <circle cx={0} cy={-24} r={6.5} vectorEffect="non-scaling-stroke" />
                            <circle cx={0} cy={0} r={6.5} vectorEffect="non-scaling-stroke" />
                        </g>
                        <circle cx={0} cy={24} r={4} fill={BRIGHT} />
                    </IsoSlab>
                </g>

                {/* Downstream puck heading off with the finished work. */}
                <Puck x={-96} y={55} r={30} depth={9} delay={0.6}>
                    {[8, 4, 0].map((lift) => (
                        <g key={lift} transform={`translate(0 ${6 - lift})`}>
                            <g transform={ISO}>
                                <rect
                                    x={-13}
                                    y={-12}
                                    width={26}
                                    height={24}
                                    rx={4}
                                    fill={SLAB_FILL}
                                    stroke={DETAIL_STROKE}
                                    strokeWidth={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                            </g>
                        </g>
                    ))}
                </Puck>
            </g>
        </motion.svg>
    );
}

export default function PullRequestCard({ lit, litDelay }: { lit: boolean; litDelay: number }) {
    return (
        <BentoCard
            lit={lit}
            litDelay={litDelay}
            label="Pull request"
            description="The finished fix rolls off the line as a PR, ready for review"
            diagram={
                <div className="absolute inset-0">
                    <ConveyorScene />
                </div>
            }
        />
    );
}
