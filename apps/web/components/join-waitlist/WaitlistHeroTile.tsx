"use client";

import { motion, useTransform } from "motion/react";

import {
    EASE_IN_OUT,
    type HeroMotion,
    INTRO_AT,
} from "@/components/join-waitlist/waitlistHeroMotion";
import { APP_LOGO_PATH, APP_LOGO_SIZE } from "@/components/logo/AppLogo";

const TILE_SIZE = 76;
const TILE_DEPTH = 5;

const TILE_SPRING = { type: "spring", stiffness: 240, damping: 22, mass: 0.9 } as const;

const squirclePath = (size: number) => {
    const edge = 0.3 * size;
    const curve = 0.1 * size;
    return [
        `M ${size / 2} 0`,
        `L ${size - edge} 0`,
        `C ${size - curve} 0 ${size} ${curve} ${size} ${edge}`,
        `L ${size} ${size - edge}`,
        `C ${size} ${size - curve} ${size - curve} ${size} ${size - edge} ${size}`,
        `L ${edge} ${size}`,
        `C ${curve} ${size} 0 ${size - curve} 0 ${size - edge}`,
        `L 0 ${edge}`,
        `C 0 ${curve} ${curve} 0 ${edge} 0`,
        "Z",
    ].join(" ");
};

const TILE_OUTLINE = squirclePath(TILE_SIZE);
const TILE_SQUIRCLE = `path("${TILE_OUTLINE}")`;
const TILE_RIM_FADE = "linear-gradient(to bottom, black 30%, transparent 60%)";
const TILE_INNER_GLOW = "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 28%)";

const TILE_GLASS =
    "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.18) 100%)";
const TILE_GRID =
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.45) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0 1px, transparent 1px 4px)";
const TILE_GRID_FADE = "radial-gradient(circle at center, black 25%, transparent 75%)";
const TILE_SHINE =
    "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)";

type Props = { heroMotion: HeroMotion };

export default function WaitlistHeroTile({ heroMotion }: Props) {
    const { phase, reduceMotion } = heroMotion;
    const x = useTransform(heroMotion.parallaxX, (value) => value * TILE_DEPTH);
    const y = useTransform(heroMotion.parallaxY, (value) => value * TILE_DEPTH);
    const floating = phase === "idle" && !reduceMotion;

    return (
        <motion.div style={{ x, y }} className="drop-shadow-[0_18px_28px_rgba(10,30,120,0.55)]">
            <motion.div
                style={{
                    background: TILE_GLASS,
                    clipPath: TILE_SQUIRCLE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.6, y: 28 }}
                animate={
                    floating
                        ? { opacity: 1, scale: 1, y: [0, -4, 0] }
                        : { opacity: 1, scale: 1, y: 0 }
                }
                transition={
                    floating
                        ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
                        : { ...TILE_SPRING, delay: INTRO_AT.tile }
                }
                className="relative flex items-center justify-center overflow-hidden backdrop-blur-[2px]"
            >
                <div
                    style={{ background: TILE_INNER_GLOW }}
                    className="pointer-events-none absolute inset-0"
                />
                <svg
                    viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
                    aria-hidden="true"
                    style={{ maskImage: TILE_RIM_FADE, WebkitMaskImage: TILE_RIM_FADE }}
                    className="pointer-events-none absolute inset-0"
                >
                    <path
                        d={TILE_OUTLINE}
                        fill="none"
                        stroke="white"
                        strokeOpacity="0.85"
                        strokeWidth="2"
                    />
                </svg>
                <div
                    style={{
                        backgroundImage: TILE_GRID,
                        maskImage: TILE_GRID_FADE,
                        WebkitMaskImage: TILE_GRID_FADE,
                    }}
                    className="absolute inset-0 opacity-45"
                />
                {!reduceMotion && (
                    <motion.div
                        style={{ background: TILE_SHINE }}
                        initial={{ x: "-160%" }}
                        animate={{ x: "260%" }}
                        transition={{ duration: 0.9, delay: INTRO_AT.shine, ease: EASE_IN_OUT }}
                        className="pointer-events-none absolute inset-y-0 left-0 w-3/5"
                    />
                )}
                <motion.svg
                    viewBox={`0 0 ${APP_LOGO_SIZE.width} ${APP_LOGO_SIZE.height}`}
                    aria-hidden="true"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...TILE_SPRING, delay: INTRO_AT.tile + 0.12 }}
                    className="relative h-auto w-[46px] drop-shadow-[0_3px_6px_rgba(20,60,200,0.35)]"
                >
                    <defs>
                        <linearGradient id="waitlist-hero-glyph" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#ffffff" />
                            <stop offset="1" stopColor="#d9d6ff" />
                        </linearGradient>
                    </defs>
                    <path d={APP_LOGO_PATH} fill="url(#waitlist-hero-glyph)" fillRule="evenodd" />
                </motion.svg>
            </motion.div>
        </motion.div>
    );
}
