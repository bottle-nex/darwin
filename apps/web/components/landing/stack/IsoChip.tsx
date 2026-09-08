"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Isometric chip geometry. The top face is a square of half-size 80 in flat "plane"
 * coordinates, projected with a 2:1 isometric matrix; DEPTH is the extruded body height.
 */
const PRIMARY = "var(--color-primary)";

const GHOST_TOP_FACE = "#ffffff";
const GHOST_SIDE_FACE = "#dcdce1";
const GHOST_EDGE = "#c4c4cb";
const GHOST_DETAIL = "#c9c9d0";
const GHOST_INSET = "#d2d2d8";
const GHOST_SCREW = "#b8b8c0";
const GHOST_GLYPH = "#85858d";

const ACTIVE_TOP_FACE_LIGHT = "#ffffff";
const ACTIVE_TOP_FACE_SHADE = "#f4f4f5";
const ACTIVE_GLYPH = "#fafafa";
const ACTIVE_EDGE = "color-mix(in srgb, var(--color-primary) 72%, #18181b)";
const ACTIVE_INSET = "color-mix(in srgb, var(--color-primary) 42%, transparent)";
const ACTIVE_DETAIL = "rgba(24, 24, 27,0.4)";

export const HALF_W = 138.56;
export const HALF_H = 80;
export const DEPTH = 34;

/** Projects flat artwork onto the top face: plane (x, y) → iso (0.866(x−y), 0.5(x+y)). */
const ISO_MATRIX = "matrix(0.866 0.5 -0.866 0.5 0 0)";

type Point = [number, number];

const fmt = (value: number) => Number(value.toFixed(2));

function roundedPolygonPath(points: Point[], radius: number): string {
    const segments: string[] = [];
    const count = points.length;
    for (let i = 0; i < count; i++) {
        const [px, py] = points[i]!;
        const [ax, ay] = points[(i - 1 + count) % count]!;
        const [bx, by] = points[(i + 1) % count]!;
        const inLength = Math.hypot(ax - px, ay - py);
        const outLength = Math.hypot(bx - px, by - py);
        const entryX = fmt(px + ((ax - px) / inLength) * radius);
        const entryY = fmt(py + ((ay - py) / inLength) * radius);
        const exitX = fmt(px + ((bx - px) / outLength) * radius);
        const exitY = fmt(py + ((by - py) / outLength) * radius);
        segments.push(`${i === 0 ? "M" : "L"} ${entryX} ${entryY}`);
        segments.push(`Q ${px} ${py} ${exitX} ${exitY}`);
    }
    return `${segments.join(" ")} Z`;
}

const diamond = (scale: number): Point[] => [
    [0, fmt(-HALF_H * scale)],
    [fmt(HALF_W * scale), 0],
    [0, fmt(HALF_H * scale)],
    [fmt(-HALF_W * scale), 0],
];

const CORNER_R = 16;

const TOP_FACE = roundedPolygonPath(diamond(1), CORNER_R);
const TOP_INSET = roundedPolygonPath(diamond(0.86), 12);
const FACE_PANEL = roundedPolygonPath(diamond(0.5), 9);

/**
 * The body is the top face swept straight down by DEPTH, so the walls stay
 * flush with the face: RX/RY are the corner-rounding offsets along the diamond
 * edges, and SIDE_X is the face's widest point — where the corner curve turns
 * vertical and the wall's outer edge takes over tangentially.
 */
const EDGE_LEN = Math.hypot(HALF_W, HALF_H);
const RX = fmt((CORNER_R * HALF_W) / EDGE_LEN);
const RY = fmt((CORNER_R * HALF_H) / EDGE_LEN);
const SIDE_X = fmt(HALF_W - RX / 2);
const BODY = [
    `M ${-SIDE_X} 0`,
    `Q ${-SIDE_X} ${fmt(RY / 2)} ${fmt(-(HALF_W - RX))} ${RY}`,
    `L ${-RX} ${fmt(HALF_H - RY)}`,
    `Q 0 ${HALF_H} ${RX} ${fmt(HALF_H - RY)}`,
    `L ${fmt(HALF_W - RX)} ${RY}`,
    `Q ${SIDE_X} ${fmt(RY / 2)} ${SIDE_X} 0`,
    `L ${SIDE_X} ${DEPTH}`,
    `Q ${SIDE_X} ${fmt(DEPTH + RY / 2)} ${fmt(HALF_W - RX)} ${fmt(DEPTH + RY)}`,
    `L ${RX} ${fmt(DEPTH + HALF_H - RY)}`,
    `Q 0 ${DEPTH + HALF_H} ${-RX} ${fmt(DEPTH + HALF_H - RY)}`,
    `L ${fmt(-(HALF_W - RX))} ${fmt(DEPTH + RY)}`,
    `Q ${-SIDE_X} ${fmt(DEPTH + RY / 2)} ${-SIDE_X} ${DEPTH}`,
    "Z",
].join(" ");

/** Vent slits near the outer corners of the two visible side faces. */
const LEFT_SLITS = Array.from({ length: 7 }, (_, i) => {
    const t = 0.1 + i * 0.04;
    return { x: fmt(-HALF_W * (1 - t)), y: fmt(HALF_H * t) };
});
const RIGHT_SLITS = Array.from({ length: 7 }, (_, i) => {
    const t = 0.66 + i * 0.04;
    return { x: fmt(HALF_W * t), y: fmt(HALF_H * (1 - t)) };
});

const SCREWS: Point[] = [
    [0, -58],
    [100, 0],
    [0, 58],
    [-100, 0],
];

type IsoChipProps = {
    variant: "active" | "ghost";
    /** Chip center inside the parent SVG. */
    x: number;
    y: number;
    /** Flat artwork (fits a ±30 box) projected onto the top face; inherits `currentColor`. */
    glyph: ReactNode;
    /** Ghost chips brighten to full strength while their text block is hovered. */
    highlighted?: boolean;
    /** Resting opacity of a ghost chip. */
    ghostOpacity?: number;
    /** Vertical offset the chip travels from during the exploded-view entrance. */
    entranceOffsetY?: number;
    float: { amplitude: number; duration: number; delay: number };
    /** Whether the parent diagram has entered the viewport; the float loop stays paused until then. */
    active?: boolean;
};

export default function IsoChip({
    variant,
    x,
    y,
    glyph,
    highlighted = false,
    ghostOpacity = 0.6,
    entranceOffsetY = 0,
    float,
    active = false,
}: IsoChipProps) {
    const reduceMotion = useReducedMotion();
    const isGhost = variant === "ghost";
    const edgeColor = isGhost ? GHOST_EDGE : ACTIVE_EDGE;
    const insetColor = isGhost ? GHOST_INSET : ACTIVE_INSET;
    const detailColor = isGhost ? GHOST_DETAIL : ACTIVE_DETAIL;

    return (
        <motion.g
            style={{ x }}
            variants={{
                hidden: { opacity: 0, y: y + entranceOffsetY },
                visible: {
                    opacity: 1,
                    y,
                    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
                },
            }}
        >
            <motion.g
                animate={reduceMotion || !active ? undefined : { y: [0, -float.amplitude, 0] }}
                transition={{
                    duration: float.duration,
                    delay: float.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <motion.g
                    animate={{ opacity: isGhost ? (highlighted ? 1 : ghostOpacity) : 1 }}
                    transition={{ duration: 0.35 }}
                >
                    {!isGhost && (
                        <>
                            <defs>
                                <linearGradient
                                    id="iso-chip-face-sheen"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                >
                                    <stop offset="0" stopColor={ACTIVE_TOP_FACE_LIGHT} />
                                    <stop offset="1" stopColor={ACTIVE_TOP_FACE_SHADE} />
                                </linearGradient>
                                <filter
                                    id="iso-chip-glow"
                                    x="-40%"
                                    y="-40%"
                                    width="180%"
                                    height="180%"
                                >
                                    <feGaussianBlur stdDeviation={18} />
                                </filter>
                            </defs>
                            <g
                                filter="url(#iso-chip-glow)"
                                opacity={0.22}
                                transform="translate(0 16)"
                            >
                                <path d={TOP_FACE} fill={PRIMARY} />
                                <path d={BODY} fill={PRIMARY} />
                            </g>
                        </>
                    )}

                    <path
                        d={BODY}
                        fill={isGhost ? GHOST_SIDE_FACE : PRIMARY}
                        stroke={edgeColor}
                        strokeWidth={1}
                    />

                    <line
                        x1={0}
                        y1={HALF_H - RY / 2}
                        x2={0}
                        y2={HALF_H + DEPTH - RY / 2}
                        stroke={detailColor}
                        strokeWidth={1}
                    />
                    {[...LEFT_SLITS, ...RIGHT_SLITS].map((slit) => (
                        <line
                            key={`${slit.x}-${slit.y}`}
                            x1={slit.x}
                            y1={slit.y + 7}
                            x2={slit.x}
                            y2={slit.y + DEPTH - 7}
                            stroke={detailColor}
                            strokeWidth={1.5}
                        />
                    ))}

                    <path
                        d={TOP_FACE}
                        fill={isGhost ? GHOST_TOP_FACE : "url(#iso-chip-face-sheen)"}
                        stroke={edgeColor}
                        strokeWidth={1}
                    />
                    <path
                        d={TOP_INSET}
                        fill="none"
                        stroke={insetColor}
                        strokeWidth={0.75}
                        opacity={0.8}
                    />
                    {SCREWS.map(([screwX, screwY]) => (
                        <circle
                            key={`${screwX}-${screwY}`}
                            cx={screwX}
                            cy={screwY}
                            r={2.5}
                            fill={isGhost ? GHOST_SCREW : PRIMARY}
                        />
                    ))}

                    {isGhost ? (
                        <path d={FACE_PANEL} fill="none" stroke={insetColor} strokeWidth={0.75} />
                    ) : (
                        <path d={FACE_PANEL} fill={PRIMARY} />
                    )}
                    <g transform={ISO_MATRIX} color={isGhost ? GHOST_GLYPH : ACTIVE_GLYPH}>
                        {glyph}
                    </g>
                </motion.g>
            </motion.g>
        </motion.g>
    );
}
