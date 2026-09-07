"use client";
import {
    GithubLogoIcon,
    JiraLogoIcon,
    LinearLogoIcon,
    NotionLogoIcon,
    SlackLogoIcon,
} from "@trymatcha/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentType, CSSProperties } from "react";

import { AppLogo } from "@/components/logo/AppLogo";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";

import { landingContainer } from "./LandingSection";
import SectionHeader from "./SectionHeader";

type TileIconProps = { className?: string; style?: CSSProperties };

type IntegrationTileSpec = {
    name: string;
    icon: ComponentType<TileIconProps>;
    iconColor: string;
    /** "r, g, b" of the glow tint behind and around the icon. */
    glow: string;
};

const TILES: IntegrationTileSpec[] = [
    { name: "GitHub", icon: GithubLogoIcon, iconColor: "#cbb6f7", glow: "184, 152, 244" },
    { name: "Notion", icon: NotionLogoIcon, iconColor: "#f4f4f5", glow: "226, 226, 231" },
    { name: "Linear", icon: LinearLogoIcon, iconColor: "#b9aeff", glow: "171, 159, 242" },
    { name: "Slack", icon: SlackLogoIcon, iconColor: "#ff9d8a", glow: "255, 122, 96" },
    { name: "Jira", icon: JiraLogoIcon, iconColor: "#7aaeff", glow: "96, 150, 255" },
];

/** The hub key at the end of the trunk — everything flows into matcha. */
const MATCHA_TILE: IntegrationTileSpec = {
    name: "matcha",
    icon: AppLogo,
    iconColor: "#ffffff",
    glow: "255, 255, 255",
};

const KEY_TILT = "perspective(640px) rotateX(47deg)";
const WALL_LAYERS = 10;

/** Slightly irregular entrances (fixed, so SSR and client agree) — keys drop in from above. */
const KEY_ENTRIES = [
    { delay: 0.35, duration: 0.7 },
    { delay: 0.05, duration: 0.85 },
    { delay: 0.5, duration: 0.6 },
    { delay: 0.2, duration: 0.75 },
    { delay: 0.65, duration: 0.65 },
];
const HUB_ENTRY = { delay: 0.95, duration: 0.7 };
/** Traces start drawing once every key has settled. */
const TRACE_DELAY = 1.7;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Wall shading by depth: a thin lip catches light at the seam, then falls fast to near-black. */
function wallShade(t: number) {
    const from = [46, 46, 52];
    const to = [23, 23, 27];
    const fall = Math.pow(t, 0.35);
    const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * fall));
    return `rgb(${r}, ${g}, ${b})`;
}

function IntegrationTile({ tile, large = false }: { tile: IntegrationTileSpec; large?: boolean }) {
    const Icon = tile.icon;

    return (
        <TooltipComponent content={tile.name}>
            <div
                className={cn(
                    "relative [--key-radius:20px] [--wall-step:1.4px]",
                    large ? "md:[--wall-step:2.8px]" : "md:[--wall-step:2.4px]",
                )}
            >
                {/* Ambient color bleed onto the board behind the tile. */}
                <div
                    aria-hidden
                    className="absolute -inset-8 rounded-full opacity-50 blur-2xl"
                    style={{
                        background: `radial-gradient(circle, rgba(${tile.glow}, 0.2), transparent 70%)`,
                    }}
                />
                {/* Extruded walls: copies of the projected face swept downward, so the box side
                traces the face's near edge exactly — deepest layer first, rim-lit layer last. */}
                {Array.from({ length: WALL_LAYERS }, (_, k) => WALL_LAYERS - k).map((depth) => (
                    <div
                        key={depth}
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                            // Corners square off and the base tucks inward, so the cap overhangs.
                            borderRadius: `calc(var(--key-radius) - ${depth}px)`,
                            transform: `translateY(calc(var(--wall-step) * ${depth})) scaleX(${1 - depth * 0.006}) ${KEY_TILT}`,
                            background: wallShade(depth / WALL_LAYERS),
                            // The deepest layer keeps a lit bottom rim so the base edge stays visible.
                            boxShadow:
                                depth === WALL_LAYERS
                                    ? "0 10px 18px -6px rgba(0, 0, 0, 0.7), inset 0 -2px 0 rgba(255, 255, 255, 0.07)"
                                    : undefined,
                        }}
                    />
                ))}
                {/* Grounding shadow painted over the base: darkens the box's bottom edge so it
                separates from the board instead of blending, and pools underneath it. */}
                <div
                    aria-hidden
                    className="absolute inset-x-1 -bottom-1 h-3 rounded-[50%] bg-black/45 blur-sm md:-bottom-2 md:h-4 md:blur-md"
                />
                <div
                    aria-hidden
                    className="absolute inset-x-0 -bottom-3 h-4 rounded-[50%] bg-black/30 blur-lg md:-bottom-5 md:h-6"
                />
                {/* Keycap tilted back onto the board; the face carries the bezel and glow. */}
                <div
                    className={cn("relative size-20", large ? "md:size-44" : "md:size-36")}
                    style={{ transform: KEY_TILT }}
                >
                    {/* Top face: thick dark bezel frame with a thin specular along the far edge. */}
                    <div
                        className={cn(
                            "absolute inset-0 rounded-[20px] p-1",
                            large ? "md:p-1.5" : "md:p-[5px]",
                        )}
                        style={{
                            background: `linear-gradient(180deg, rgba(${tile.glow}, 0.45) 0%, #38383e 6%, #1b1b1f 40%, #060607 100%)`,
                            boxShadow: `0 0 24px rgba(${tile.glow}, 0.16)`,
                        }}
                    >
                        {/* Screen: lit from the top edge, even color wash, dotted texture. */}
                        <div
                            className={cn(
                                "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[16px]",
                                large ? "md:rounded-[14px]" : "md:rounded-[15px]",
                            )}
                            style={{
                                background: `radial-gradient(130% 70% at 50% -8%, rgba(${tile.glow}, 0.5), rgba(${tile.glow}, 0.1) 55%, transparent 78%), radial-gradient(60% 45% at 50% 58%, rgba(${tile.glow}, 0.12), transparent 72%), linear-gradient(180deg, #1a1a20, #0c0c0f)`,
                                boxShadow: `inset 0 0 28px rgba(${tile.glow}, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -14px 24px rgba(0, 0, 0, 0.6)`,
                            }}
                        >
                            <div
                                aria-hidden
                                className="absolute inset-0 opacity-40"
                                style={{
                                    backgroundImage: `radial-gradient(rgba(${tile.glow}, 0.55) 0.5px, transparent 0.6px)`,
                                    backgroundSize: "5px 5px",
                                    maskImage:
                                        "radial-gradient(85% 85% at 50% 35%, black, transparent)",
                                }}
                            />
                            <Icon
                                className={cn(
                                    "relative size-9",
                                    large ? "md:size-20" : "md:size-14",
                                )}
                                style={{
                                    color: tile.iconColor,
                                    filter: `drop-shadow(0 0 8px rgba(${tile.glow}, 0.45))`,
                                }}
                            />
                        </div>
                    </div>
                </div>
                {/* Solder pins where the row bus meets the tile. */}
                <span
                    aria-hidden
                    className="absolute top-1/2 -left-3 size-1.5 -translate-y-1/2 rounded-full bg-[#303036]"
                />
                <span
                    aria-hidden
                    className="absolute top-1/2 -right-3 size-1.5 -translate-y-1/2 rounded-full bg-[#303036]"
                />
            </div>
        </TooltipComponent>
    );
}

/**
 * PCB traces in the same coordinate system as the tile grid: the tiles sit in five
 * equal columns, so their centers are at x = 100/300/500/700/900 in a 1000-wide
 * viewBox stretched across the grid (preserveAspectRatio="none"). y=0 is the bus
 * line through the tile pins. One route per tile drops out of the key, elbows
 * toward the center and joins a five-line trunk that runs down into the matcha
 * hub key (the routes end at y=300, behind the hub, so the pulses appear to be
 * absorbed by it). Negative begins stagger the pulses mid-cycle from first paint.
 */
const FLOW_PATHS = [
    "M100 56 V190 Q100 202 112 202 H468 Q480 202 480 214 V300",
    "M300 56 V150 Q300 162 312 162 H478 Q490 162 490 174 V300",
    "M500 56 V300",
    "M700 56 V150 Q700 162 688 162 H522 Q510 162 510 174 V300",
    "M900 56 V190 Q900 202 888 202 H532 Q520 202 520 214 V300",
];

// Full-width line behind the keys: the opaque keys occlude the middle, so the
// visible pieces always meet the key edges exactly. Routes likewise start up
// inside the key walls (y=56) and emerge at the base.
const BUS_LINE = "M0 1 H1000";

function CircuitBoard() {
    const reduceMotion = useReducedMotion();

    return (
        <svg
            aria-hidden
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
            fill="none"
            className="pointer-events-none absolute top-[152px] left-6 hidden h-[calc(100%-152px)] w-[calc(100%-48px)] md:block"
        >
            {/* Bus running through the tile pins, broken where the keys sit. */}
            <motion.path
                d={BUS_LINE}
                stroke="#1e1e22"
                vectorEffect="non-scaling-stroke"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: TRACE_DELAY - 0.4, duration: 0.6 }}
            />

            {/* The five routes, drawn from each key down into the matcha hub. */}
            {/* No non-scaling-stroke on these: it breaks the pathLength dash math under the
                stretched viewBox, leaving long routes drawn short of their endpoint. */}
            {FLOW_PATHS.map((d, i) => (
                <motion.path
                    key={d}
                    d={d}
                    stroke="#26262b"
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        pathLength: {
                            delay: TRACE_DELAY + i * 0.12,
                            duration: 0.9,
                            ease: "easeInOut",
                        },
                        opacity: { delay: TRACE_DELAY + i * 0.12, duration: 0.2 },
                    }}
                />
            ))}

            {/* Vias at the outer elbows, standoffs and pads for board texture. */}
            <motion.g
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: TRACE_DELAY + 0.5, duration: 0.8 }}
            >
                <circle
                    cx={100}
                    cy={190}
                    r={3}
                    stroke="#2c2c31"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={900}
                    cy={190}
                    r={3}
                    stroke="#2c2c31"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={240}
                    cy={300}
                    r={13}
                    stroke="#1b1b1f"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={240}
                    cy={300}
                    r={4.5}
                    stroke="#232328"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={812}
                    cy={318}
                    r={11}
                    stroke="#1b1b1f"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={812}
                    cy={318}
                    r={4}
                    stroke="#232328"
                    vectorEffect="non-scaling-stroke"
                />
                <rect x={588} y={300} width={34} height={10} rx={3} stroke="#1b1b1f" />
                <rect x={602} y={322} width={34} height={10} rx={3} stroke="#1b1b1f" />
                <rect x={382} y={252} width={7} height={7} stroke="#1b1b1f" />
                <rect x={652} y={236} width={8} height={8} stroke="#1b1b1f" />
            </motion.g>

            {/* Light pulses appear once the traces have finished connecting. */}
            <motion.g
                className="motion-reduce:hidden"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: TRACE_DELAY + 1.5, duration: 0.8 }}
            >
                {FLOW_PATHS.map((d, i) => (
                    <circle
                        key={d}
                        r={2.6}
                        fill="var(--color-primary)"
                        style={{
                            filter: "drop-shadow(0 0 5px color-mix(in srgb, var(--color-primary) 90%, transparent))",
                        }}
                    >
                        <animateMotion
                            path={d}
                            dur={`${5 + i * 0.7}s`}
                            begin={`${-i * 1.3}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                ))}
            </motion.g>
        </svg>
    );
}

export default function LandingIntegrations() {
    const reduceMotion = useReducedMotion();

    return (
        <section className="relative overflow-hidden rounded-2xl font-grotesk pt-30">
            <div className={landingContainer}>
                <SectionHeader
                    title="Every tool your team already uses."
                    titleContinued="GitHub, Linear, Jira, Slack, and Notion feed one board."
                    description="Connect a workspace once and issues keep landing here. No copy-paste, no second tracker to keep alive."
                />
            </div>
            {/* Soft vignette behind the tile cluster. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]"
                style={{
                    background:
                        "radial-gradient(60% 55% at 50% 32%, rgba(140, 128, 200, 0.03), transparent 70%)",
                }}
            />

            {/* Integration tiles over the circuit board. */}
            <div className="relative mx-auto max-w-6xl px-6">
                <CircuitBoard />
                {/* Key centers sit at pt-20 + half key (72px) = 152px — the circuit svg's top
                    offset must match, so change them together. */}
                <div className="relative grid grid-cols-5 justify-items-center pt-20">
                    {TILES.map((tile, i) => (
                        <motion.div
                            key={tile.name}
                            initial={reduceMotion ? false : { opacity: 0, y: -48 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...KEY_ENTRIES[i], ease: EASE_OUT }}
                        >
                            <IntegrationTile tile={tile} />
                        </motion.div>
                    ))}
                </div>
                {/* Board area the trunk descends through, down to the matcha hub key. */}
                <div aria-hidden className="hidden md:block md:h-72 mt-15" />
                <div className="absolute -bottom-2 left-1/2 hidden -translate-x-1/2 md:block">
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: -48 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...HUB_ENTRY, ease: EASE_OUT }}
                    >
                        <IntegrationTile tile={MATCHA_TILE} large />
                    </motion.div>
                </div>
            </div>

            <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-52 pb-28 text-center md:pt-20 md:pb-36"></div>
        </section>
    );
}
