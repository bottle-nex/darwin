"use client";

import { motion, type TargetAndTransition, type Transition, useTransform } from "motion/react";

import type { HeroMotion } from "@/components/join-waitlist/waitlistHeroMotion";
import type { GlowBlob } from "@/types/waitlistHero.type";

const DRIFTS = [
    { x: 12, y: -10 },
    { x: -14, y: 8 },
    { x: 10, y: 14 },
    { x: -12, y: -12 },
    { x: 16, y: 6 },
    { x: -10, y: -16 },
    { x: 14, y: 12 },
];

type BlobMotion = { animate: TargetAndTransition; transition: Transition };

type Props = {
    blobs: GlowBlob[];
    gradient: string;
    blur: number;
    depth: number;
    heroMotion: HeroMotion;
};

export default function WaitlistHeroGlow({ blobs, gradient, blur, depth, heroMotion }: Props) {
    const x = useTransform(heroMotion.parallaxX, (value) => value * depth);
    const y = useTransform(heroMotion.parallaxY, (value) => value * depth);

    return (
        <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0">
            {blobs.map((blob, index) => {
                const { animate, transition } = blobMotion(heroMotion, blob, index);

                return (
                    <motion.div
                        key={index}
                        style={{
                            left: `calc(50% + ${blob.dx}px)`,
                            top: `calc(50% + ${blob.dy}px)`,
                            width: blob.width,
                            height: blob.height,
                            background: gradient,
                            filter: `blur(${blur}px)`,
                            willChange: heroMotion.phase === "idle" ? "transform" : undefined,
                        }}
                        initial={false}
                        animate={animate}
                        transition={transition}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    />
                );
            })}
        </motion.div>
    );
}

function blobMotion(
    { phase, reduceMotion }: HeroMotion,
    blob: GlowBlob,
    index: number,
): BlobMotion {
    if (phase === "idle" && !reduceMotion) {
        const drift = DRIFTS[index % DRIFTS.length];
        return {
            animate: {
                opacity: blob.opacity,
                scale: [1, 1.04, 1],
                x: [0, drift.x, 0],
                y: [0, drift.y, 0],
            },
            transition: { duration: 9 + (index % 5) * 1.25, repeat: Infinity, ease: "easeInOut" },
        };
    }

    return {
        animate: { opacity: blob.opacity, scale: 1, x: 0, y: 0 },
        transition: { duration: 0 },
    };
}
