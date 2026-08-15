"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { MatchaLogo } from "@/components/logo/MatchaLogo";
import BentoCard from "./BentoCard";

/** The dock plane: centered, tilted back, and turned so it runs down-right like a ramp. */
const PLANE_TRANSFORM = "translate(-50%, -50%) rotateX(55deg) rotateZ(45deg)";

/** Slab thicknesses, in px along the plane normal. */
const STRIP_DEPTH = 12;
const TILE_DEPTH = 10;
const MATCHA_DEPTH = 16;
const MATCHA_LIFT_Z = 30;

type DockTile = {
    name: string;
    icon?: string;
    /** Softness and presence fall off the further the tile sits from the lifted one. */
    blur?: number;
    opacity?: number;
};

const DOCK_TILES: DockTile[] = [
    { name: "GitHub", icon: "/images/integrations/github.svg", blur: 1.5, opacity: 0.55 },
    { name: "matcha" },
    { name: "Linear", icon: "/images/integrations/linear.svg", blur: 2, opacity: 0.5 },
    { name: "Notion", icon: "/images/integrations/notion.svg", blur: 2.5, opacity: 0.45 },
    { name: "Figma", icon: "/images/integrations/figma.svg", blur: 3.5, opacity: 0.4 },
    { name: "Slack", icon: "/images/integrations/slack.svg", blur: 4.5, opacity: 0.35 },
];

function fadeTo(opacity: number, delay: number) {
    return {
        hidden: { opacity: 0 },
        visible: { opacity, transition: { delay, duration: 0.5 } },
    };
}

/**
 * Evenly spaced outline copies stacked below a slab's top face — the rounded
 * silhouette repeated along the normal reads as an extruded, ribbed side.
 * Opacity and filters live on these leaf faces, never on the preserve-3d
 * containers, because both force CSS to flatten the 3D subtree.
 */
function sideLayerOffsets(depth: number, count: number) {
    return Array.from({ length: count }, (_, i) => (depth * i) / count);
}

/** The matcha slab rises off the dock once the faded neighbours have settled. */
const LIFT = {
    hidden: { z: 2 },
    visible: {
        z: MATCHA_LIFT_Z,
        transition: { delay: 0.7, type: "spring" as const, bounce: 0.3, duration: 0.9 },
    },
};

function FadedTile({ tile, delay }: { tile: DockTile; delay: number }) {
    const soften = { filter: `blur(${tile.blur ?? 2}px)` };
    const presence = tile.opacity ?? 0.5;

    return (
        <div className="relative h-14 w-14" style={{ transformStyle: "preserve-3d" }}>
            {sideLayerOffsets(TILE_DEPTH, 4).map((z) => (
                <motion.span
                    key={z}
                    variants={fadeTo(presence * 0.85, delay)}
                    className="absolute inset-0 rounded-2xl border border-white/[0.07] bg-[#151516]"
                    style={{ ...soften, transform: `translateZ(${z + 1}px)` }}
                />
            ))}
            <motion.span
                variants={fadeTo(presence, delay)}
                className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-[#232324]"
                style={{ ...soften, transform: `translateZ(${TILE_DEPTH + 1}px)` }}
            >
                <Image
                    src={tile.icon ?? ""}
                    alt=""
                    width={28}
                    height={28}
                    className="select-none"
                    style={{ filter: "grayscale(1) invert(0.85)" }}
                />
            </motion.span>
        </div>
    );
}

function MatchaTile() {
    return (
        <div className="relative h-14 w-14" style={{ transformStyle: "preserve-3d" }}>
            <motion.span
                variants={fadeTo(1, 0.7)}
                className="absolute -inset-1.5 rounded-2xl bg-black/60 blur-md"
                style={{ transform: "translateZ(3px)" }}
            />
            <motion.div
                variants={LIFT}
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
            >
                <motion.div
                    className="absolute inset-0"
                    style={{ transformStyle: "preserve-3d" }}
                    variants={{ hovering: { z: 14 } }}
                    transition={{ type: "spring", stiffness: 210, damping: 20 }}
                >
                    {sideLayerOffsets(MATCHA_DEPTH, 6).map((z) => (
                        <motion.span
                            key={z}
                            variants={fadeTo(1, 0.7)}
                            className="absolute inset-0 rounded-2xl border border-white/10 bg-[#0b0b0c]"
                            style={{ transform: `translateZ(${z}px)` }}
                        />
                    ))}
                    <motion.span
                        variants={fadeTo(1, 0.7)}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/20 bg-linear-to-b from-[#232324] to-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                        style={{ transform: `translateZ(${MATCHA_DEPTH}px)` }}
                    >
                        <MatchaLogo className="h-4.5 w-auto text-snow" />
                    </motion.span>
                </motion.div>
            </motion.div>
        </div>
    );
}

function DockScene() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            aria-hidden
            className="relative -mx-5 -mt-5 h-[calc(100%+1.25rem)] md:-mx-50 md:-mt-6 md:h-[calc(100%+3.5rem)]"
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            whileHover={reduceMotion ? undefined : "hovering"}
            viewport={{ once: true, amount: 0.4 }}
        >
            <div
                className="absolute inset-0 scale-[0.72] md:scale-100"
                style={{ perspective: "1400px" }}
            >
                <div
                    className="absolute top-[64%] left-[56%] h-140 w-140"
                    style={{ transform: PLANE_TRANSFORM, transformStyle: "preserve-3d" }}
                >
                    <div
                        className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4 rounded-[22px] px-5 py-4"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {sideLayerOffsets(STRIP_DEPTH, 4).map((z) => (
                            <motion.span
                                key={z}
                                variants={fadeTo(1, 0.1)}
                                className="absolute inset-0 rounded-[22px] border border-white/6 bg-[#101011]"
                                style={{ transform: `translateZ(${z - STRIP_DEPTH}px)` }}
                            />
                        ))}
                        <motion.span
                            variants={fadeTo(1, 0.1)}
                            className="absolute inset-0 rounded-[22px] border border-white/10 bg-[#1c1c1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        />
                        {DOCK_TILES.map((tile, i) =>
                            tile.icon ? (
                                <FadedTile key={tile.name} tile={tile} delay={0.3 + i * 0.08} />
                            ) : (
                                <MatchaTile key={tile.name} />
                            ),
                        )}
                        <motion.span
                            variants={fadeTo(1, 0.55)}
                            className="absolute bottom-2 left-[68px] h-1 w-1 rounded-full bg-white/30"
                            style={{ transform: "translateZ(1px)" }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function RunnerCard({ lit, litDelay }: { lit: boolean; litDelay: number }) {
    return (
        <BentoCard
            lit={lit}
            litDelay={litDelay}
            label="Runner"
            description="Your stack spins up in a sandbox where the fix is built and tested"
            diagram={<DockScene />}
        />
    );
}
