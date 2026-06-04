"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { animate } from "motion/react";
import { GiAbstract042 } from "react-icons/gi";

const VIEW_W = 1400;
const VIEW_H = 460;

const TOP_Y = 50;
const BOTTOM_Y = 410;

const CARD_LEFT_X = 620;
const CARD_RIGHT_X = 760;
const ENTRY_TOP_Y = 195;
const ENTRY_BOTTOM_Y = 265;
const CURVE_RX = 100;
const CURVE_RY = ENTRY_TOP_Y - TOP_Y;

const CURVE_START_LEFT = CARD_LEFT_X - CURVE_RX;
const CURVE_START_RIGHT = CARD_RIGHT_X + CURVE_RX;

const EDGE_OVERSHOOT = 110;
const CARD_ENTER = 40;

const PATHS = [
    `M 0 ${TOP_Y} L ${CURVE_START_LEFT} ${TOP_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 1 ${CARD_LEFT_X} ${ENTRY_TOP_Y}`,
    `M ${VIEW_W} ${TOP_Y} L ${CURVE_START_RIGHT} ${TOP_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 0 ${CARD_RIGHT_X} ${ENTRY_TOP_Y}`,
    `M 0 ${BOTTOM_Y} L ${CURVE_START_LEFT} ${BOTTOM_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 0 ${CARD_LEFT_X} ${ENTRY_BOTTOM_Y}`,
    `M ${VIEW_W} ${BOTTOM_Y} L ${CURVE_START_RIGHT} ${BOTTOM_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 1 ${CARD_RIGHT_X} ${ENTRY_BOTTOM_Y}`,
];

const TOP_LEFT_DOT_X = 120;
const TOP_RIGHT_DOT_X = 1280;

const INNER_DOT_OFFSET = 40;
const INNER_LEFT_DOT_X = CURVE_START_LEFT - INNER_DOT_OFFSET;
const INNER_RIGHT_DOT_X = CURVE_START_RIGHT + INNER_DOT_OFFSET;

const NODES = [
    { x: TOP_LEFT_DOT_X, y: TOP_Y },
    { x: INNER_LEFT_DOT_X, y: TOP_Y },
    { x: INNER_RIGHT_DOT_X, y: TOP_Y },
    { x: TOP_RIGHT_DOT_X, y: TOP_Y },
    { x: INNER_LEFT_DOT_X, y: BOTTOM_Y },
    { x: INNER_RIGHT_DOT_X, y: BOTTOM_Y },
];

type Hop = {
    pathD: string;
    label: string;
    popIn: boolean;
    popOut: boolean;
};

// Constant travel speed in viewBox units per second. Each hop's duration is
// derived from this so the badge moves at the same pace on every segment,
// regardless of how long the path is.
const TRAVEL_SPEED = 110;
const POP_DURATION = 0.35;
const HOP_OVERLAP = 0.32;

const TOP_HOPS: Hop[] = [
    {
        pathD: `M ${-EDGE_OVERSHOOT} ${TOP_Y} L ${TOP_LEFT_DOT_X} ${TOP_Y}`,
        label: "Repo",
        popIn: false,
        popOut: true,
    },
    {
        pathD: `M ${TOP_LEFT_DOT_X} ${TOP_Y} L ${CURVE_START_LEFT} ${TOP_Y}`,
        label: "Issue",
        popIn: true,
        popOut: true,
    },
    {
        pathD: `M ${CURVE_START_LEFT} ${TOP_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 1 ${CARD_LEFT_X} ${ENTRY_TOP_Y} L ${CARD_LEFT_X + CARD_ENTER} ${ENTRY_TOP_Y}`,
        label: "Plan",
        popIn: true,
        popOut: false,
    },
    {
        pathD: `M ${CARD_RIGHT_X - CARD_ENTER} ${ENTRY_TOP_Y} L ${CARD_RIGHT_X} ${ENTRY_TOP_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 1 ${CURVE_START_RIGHT} ${TOP_Y}`,
        label: "Code",
        popIn: false,
        popOut: true,
    },
    {
        pathD: `M ${CURVE_START_RIGHT} ${TOP_Y} L ${TOP_RIGHT_DOT_X} ${TOP_Y}`,
        label: "Test",
        popIn: true,
        popOut: true,
    },
    {
        pathD: `M ${TOP_RIGHT_DOT_X} ${TOP_Y} L ${VIEW_W + EDGE_OVERSHOOT} ${TOP_Y}`,
        label: "PR",
        popIn: true,
        popOut: false,
    },
];

const BOTTOM_HOPS: Hop[] = [
    {
        pathD: `M ${-EDGE_OVERSHOOT} ${BOTTOM_Y} L ${CURVE_START_LEFT} ${BOTTOM_Y}`,
        label: "Customer",
        popIn: false,
        popOut: true,
    },
    {
        pathD: `M ${CURVE_START_LEFT} ${BOTTOM_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 0 ${CARD_LEFT_X} ${ENTRY_BOTTOM_Y} L ${CARD_LEFT_X + CARD_ENTER} ${ENTRY_BOTTOM_Y}`,
        label: "Bug",
        popIn: true,
        popOut: false,
    },
    {
        pathD: `M ${CARD_RIGHT_X - CARD_ENTER} ${ENTRY_BOTTOM_Y} L ${CARD_RIGHT_X} ${ENTRY_BOTTOM_Y} A ${CURVE_RX} ${CURVE_RY} 0 0 0 ${CURVE_START_RIGHT} ${BOTTOM_Y}`,
        label: "Fix",
        popIn: false,
        popOut: true,
    },
    {
        pathD: `M ${CURVE_START_RIGHT} ${BOTTOM_Y} L ${VIEW_W + EDGE_OVERSHOOT} ${BOTTOM_Y}`,
        label: "Deploy",
        popIn: true,
        popOut: false,
    },
];

// ────────────────────────────────────────────────────────────────────────────
// LogoProcessor
// ────────────────────────────────────────────────────────────────────────────
// Renders the logo as a glossy, tile-mosaic diagonal wave. Architecture:
//   • Base layer is the real SVG icon — that's the resting visual.
//   • An N×N grid of "glass tiles" sits on top, clipped to the icon silhouette
//     via a CSS mask-image of the same SVG. Each tile has a static glassy
//     gradient + inset highlights + outer halo; only `opacity` is animated.
// triggerProcessing(direction) starts a diagonal sweep — cells light up in
// layer order so the wave reads as energy passing through the logo.

type WaveDirection = "tl-br" | "tr-bl" | "bl-tr" | "br-tl";

interface LogoProcessorHandle {
    triggerProcessing: (direction: WaveDirection) => void;
}

const LOGO_GRID = 24;
const LOGO_SAMPLE_SIZE = 256;
const TOTAL_CELLS = LOGO_GRID * LOGO_GRID;

// Wave timing (ms). Snappy values so the sweep reads as "processing" rather
// than a blob fade.
const LAYER_STEP_MS = 14;
const RISE_MS = 60;
const FALL_MS = 280;

// Delay between Plan/Bug hop activating and the wave firing. The badge takes
// roughly this long to travel the curve and disappear behind the card.
const BEHIND_LOGO_DELAY_MS = 700;

function getLayer(row: number, col: number, dir: WaveDirection): number {
    switch (dir) {
        case "tl-br":
            return row + col;
        case "tr-bl":
            return row + (LOGO_GRID - 1 - col);
        case "bl-tr":
            return LOGO_GRID - 1 - row + col;
        case "br-tl":
            return LOGO_GRID - 1 - row + (LOGO_GRID - 1 - col);
    }
}

const LogoProcessor = forwardRef<LogoProcessorHandle>((_, ref) => {
    // The SVG itself becomes the mask — clips the grid to the exact icon
    // silhouette with antialiased edges.
    const [maskUrl, setMaskUrl] = useState<string>("");
    const cellEls = useRef<Array<HTMLDivElement | null>>([]);
    const waveRef = useRef<{ start: number; direction: WaveDirection } | null>(null);

    useEffect(() => {
        const markup = renderToStaticMarkup(
            <GiAbstract042 size={LOGO_SAMPLE_SIZE} color="#ffffff" />,
        );
        const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        setMaskUrl(url);
        return () => URL.revokeObjectURL(url);
    }, []);

    // rAF loop. Mutates `opacity` only — GPU composited, no paint cost.
    useEffect(() => {
        let raf = 0;
        const tick = (now: number) => {
            const wave = waveRef.current;
            if (wave) {
                const elapsed = now - wave.start;
                let stillRunning = false;
                for (let i = 0; i < TOTAL_CELLS; i++) {
                    const el = cellEls.current[i];
                    if (!el) continue;
                    const row = (i / LOGO_GRID) | 0;
                    const col = i - row * LOGO_GRID;
                    const layer = getLayer(row, col, wave.direction);
                    const local = elapsed - layer * LAYER_STEP_MS;
                    let act = 0;
                    if (local >= 0) {
                        if (local < RISE_MS) {
                            const t = local / RISE_MS;
                            act = 1 - (1 - t) * (1 - t);
                        } else {
                            const t = (local - RISE_MS) / FALL_MS;
                            act = t >= 1 ? 0 : (1 - t) * (1 - t);
                        }
                    }
                    el.style.opacity = act.toFixed(3);
                    if (act > 0.001 || local < 0) stillRunning = true;
                }
                if (!stillRunning) {
                    waveRef.current = null;
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    useImperativeHandle(ref, () => ({
        triggerProcessing: (direction: WaveDirection) => {
            waveRef.current = { start: performance.now(), direction };
        },
    }));

    return (
        <div style={{ position: "absolute", inset: 0, isolation: "isolate" }} aria-hidden>
            {/* Resting state — the real SVG, dark. */}
            <GiAbstract042
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    color: "#111111",
                    display: "block",
                }}
            />
            {/* Mask-clipped overlay grid. Each tile carries a glass body and
                shine; opacity carries the wave. */}
            {maskUrl && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        gridTemplateColumns: `repeat(${LOGO_GRID}, 1fr)`,
                        gridTemplateRows: `repeat(${LOGO_GRID}, 1fr)`,
                        pointerEvents: "none",
                        maskImage: `url(${maskUrl})`,
                        WebkitMaskImage: `url(${maskUrl})`,
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskMode: "luminance",
                    }}
                >
                    {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                cellEls.current[i] = el;
                            }}
                            style={{
                                // Diagonal specular sheen on top of vertical
                                // body shading — two stacked linear-gradients
                                // give each cell the glass-tile look.
                                background:
                                    "linear-gradient(135deg, rgba(255, 235, 215, 0.55) 0%, rgba(255, 235, 215, 0) 38%, rgba(0, 0, 0, 0) 70%, rgba(60, 18, 8, 0.28) 100%), " +
                                    "linear-gradient(180deg, #F8845B 0%, #E8613D 48%, #C24A2B 100%)",
                                // Inset top = glass lip catching light.
                                // Inset bottom = soft under-shadow.
                                // Outer = warm emissive halo.
                                boxShadow:
                                    "inset 0 0.6px 0 rgba(255, 235, 215, 0.55), " +
                                    "inset 0 -0.6px 0 rgba(70, 22, 10, 0.35), " +
                                    "0 0 6px rgba(232, 97, 61, 0.35), " +
                                    "0 0 1.5px rgba(255, 138, 92, 0.5)",
                                borderRadius: 0.5,
                                opacity: 0,
                                willChange: "opacity",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
LogoProcessor.displayName = "LogoProcessor";

export default function LandingHero() {
    // Imperative handle into the logo processor. Each FlowingLine triggers it
    // from onActiveHopChange when its centre-entering hop activates.
    const processorRef = useRef<LogoProcessorHandle>(null);

    return (
        <div className="min-h-screen w-screen relative overflow-hidden flex flex-col items-center pt-24 pb-20">
            <div className="absolute inset-0 pointer-events-none" />

            <div className="relative w-full aspect-1400/460 xl:[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] xl:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
                <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full"
                    fill="none"
                >
                    {PATHS.map((d, i) => (
                        <path
                            key={i}
                            d={d}
                            stroke="#d8d8d8"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    ))}

                    {NODES.map((n, i) => (
                        <circle key={i} cx={n.x} cy={n.y} r={5} fill="#000" />
                    ))}

                    <FlowingLine
                        hops={TOP_HOPS}
                        startDelay={0}
                        onActiveHopChange={(_, label) => {
                            // Wave fires after the badge has time to travel
                            // the curve and disappear behind the card.
                            if (label === "Plan") {
                                setTimeout(() => {
                                    processorRef.current?.triggerProcessing("tl-br");
                                }, BEHIND_LOGO_DELAY_MS);
                            }
                        }}
                    />
                    <FlowingLine
                        hops={BOTTOM_HOPS}
                        startDelay={1.5}
                        onActiveHopChange={(_, label) => {
                            if (label === "Bug") {
                                setTimeout(() => {
                                    processorRef.current?.triggerProcessing("bl-tr");
                                }, BEHIND_LOGO_DELAY_MS);
                            }
                        }}
                    />

                    <rect x={580} y={110} width={240} height={240} rx={40} fill="#ebe7e2" />
                    <rect x={595} y={125} width={210} height={210} rx={32} fill="#ffffff" />
                    <foreignObject x={640} y={170} width={120} height={120}>
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            <LogoProcessor ref={processorRef} />
                        </div>
                    </foreignObject>
                </svg>
            </div>

            <div className="mt-12"></div>

            <p className="relative mt-10 max-w-125 text-center text-[#6f6f6f] text-[20px] leading-normal px-4">
                PlayerZero brings AI to a new era of software development beyond the code editor.
            </p>

            <div className="relative mt-8 inline-flex items-center bg-[#1d0f0f] rounded-[20px] p-1.5">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-0.75">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="w-1.25 h-1.25 rounded-full bg-white" />
                        ))}
                    </div>
                </div>
                <div className="px-5 pr-6 text-white text-[16px] font-semibold">Request a Demo</div>
            </div>
        </div>
    );
}

function FlowingLine({
    hops,
    startDelay,
    onActiveHopChange,
}: {
    hops: Hop[];
    startDelay: number;
    onActiveHopChange?: (index: number, label: string) => void;
}) {
    const pathRefs = useRef<(SVGPathElement | null)[]>([]);
    const groupRefs = useRef<(SVGGElement | null)[]>([]);
    // Hold the latest callback in a ref so the animation effect doesn't
    // restart when the parent passes an inline function.
    const onActiveHopChangeRef = useRef(onActiveHopChange);
    useEffect(() => {
        onActiveHopChangeRef.current = onActiveHopChange;
    }, [onActiveHopChange]);

    useEffect(() => {
        const paths = pathRefs.current;
        const groups = groupRefs.current;
        if (paths.length !== hops.length || groups.length !== hops.length) return;
        for (const p of paths) if (!p) return;
        for (const g of groups) if (!g) return;

        const pathLengths = paths.map((p) => p!.getTotalLength());
        const durations = pathLengths.map((len) => len / TRAVEL_SPEED);
        const schedule: { start: number; end: number; duration: number }[] = [];
        let cursor = 0;
        for (let i = 0; i < hops.length; i++) {
            schedule.push({ start: cursor, end: cursor + durations[i], duration: durations[i] });
            cursor += durations[i] - HOP_OVERLAP;
        }
        const total = schedule[schedule.length - 1].end;
        // Tracks the latest-started currently-active hop so the observer
        // callback only fires on transitions, not every frame.
        let lastActiveIdx = -1;

        const apply = (t: number) => {
            for (let i = 0; i < hops.length; i++) {
                const hop = hops[i];
                const { start, end, duration } = schedule[i];
                const group = groups[i]!;
                const path = paths[i]!;
                const length = pathLengths[i];

                if (t < start || t >= end) {
                    group.setAttribute("opacity", "0");
                    continue;
                }

                const localT = (t - start) / duration;
                const point = path.getPointAtLength(localT * length);
                const timeIntoHop = t - start;
                const timeRemaining = end - t;

                let scale = 1;
                if (hop.popIn && timeIntoHop < POP_DURATION) {
                    scale = easeOutBack(timeIntoHop / POP_DURATION);
                } else if (hop.popOut && timeRemaining < POP_DURATION) {
                    scale = easeInBackOut(1 - timeRemaining / POP_DURATION);
                }
                if (scale < 0) scale = 0;

                group.setAttribute(
                    "transform",
                    `translate(${point.x}, ${point.y}) scale(${scale.toFixed(4)})`,
                );
                group.setAttribute("opacity", "1");
            }

            // Find the latest-started currently-active hop. During overlap,
            // the newer hop wins so the parent observer tracks the most
            // recent badge.
            let activeIdx = -1;
            for (let i = hops.length - 1; i >= 0; i--) {
                if (t >= schedule[i].start && t < schedule[i].end) {
                    activeIdx = i;
                    break;
                }
            }
            if (activeIdx !== lastActiveIdx) {
                lastActiveIdx = activeIdx;
                if (activeIdx >= 0) {
                    onActiveHopChangeRef.current?.(activeIdx, hops[activeIdx].label);
                }
            }
        };

        apply(0);

        const controls = animate(0, total, {
            duration: total,
            delay: startDelay,
            repeat: Infinity,
            ease: "linear",
            onUpdate: apply,
        });

        return () => controls.stop();
    }, [hops, startDelay]);

    return (
        <>
            {hops.map((hop, i) => (
                <path
                    key={`p-${i}`}
                    ref={(el) => {
                        pathRefs.current[i] = el;
                    }}
                    d={hop.pathD}
                    fill="none"
                    stroke="none"
                />
            ))}
            {hops.map((hop, i) => (
                <g
                    key={`g-${i}`}
                    ref={(el) => {
                        groupRefs.current[i] = el;
                    }}
                    opacity={0}
                >
                    <foreignObject
                        x={-80}
                        y={-20}
                        width={160}
                        height={40}
                        style={{ overflow: "visible" }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                className="h-7 px-4 rounded-full bg-[#f7f7f7] border border-[#d8d8d8] text-[12px] font-medium text-[#1d0f0f] flex items-center justify-center whitespace-nowrap tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                style={{
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                }}
                            >
                                {hop.label}
                            </div>
                        </div>
                    </foreignObject>
                </g>
            ))}
        </>
    );
}

// 0 → 1, springs past 1 then settles. Elastic feel at the dot.
function easeOutBack(t: number): number {
    const c1 = 2.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// 1 → 0, bumps slightly above 1 first (anticipation) then shrinks into the dot.
function easeInBackOut(u: number): number {
    const c1 = 2.2;
    const c3 = c1 + 1;
    return 1 - (c3 * u * u * u - c1 * u * u);
}

function DotText({ text }: { text: string }) {
    return (
        <h2
            className="relative text-center font-black select-none"
            style={{
                fontSize: 90,
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "transparent",
                backgroundImage: "radial-gradient(circle, #1d0f0f 2px, transparent 2.5px)",
                backgroundSize: "10px 10px",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
        >
            {text}
        </h2>
    );
}

function Logo() {
    return (
        <svg viewBox="0 0 100 100" className="w-[88px] h-[88px]" fill="#0a0a0a">
            <rect x="30" y="4" width="40" height="36" rx="6" />
            <rect x="30" y="60" width="40" height="36" rx="6" />
            <rect x="4" y="30" width="36" height="40" rx="6" />
            <rect x="60" y="30" width="36" height="40" rx="6" />
        </svg>
    );
}
