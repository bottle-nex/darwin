"use client";

import { motion, type MotionValue, useTransform } from "motion/react";

import { MoonSprite } from "./PixelSprites";

type Star = { x: number; y: number; size: number; tone: string; twinkle?: number };

const STARS: Star[] = [
    { x: 4, y: 12, size: 2, tone: "#4C4C5E" },
    { x: 9, y: 34, size: 1, tone: "#34343E" },
    { x: 13, y: 8, size: 1, tone: "#34343E", twinkle: 0 },
    { x: 17, y: 26, size: 2, tone: "#4C4C5E" },
    { x: 22, y: 15, size: 1, tone: "#34343E" },
    { x: 26, y: 40, size: 1, tone: "#34343E" },
    { x: 29, y: 6, size: 2, tone: "#8D86C9", twinkle: 1.6 },
    { x: 33, y: 22, size: 1, tone: "#34343E" },
    { x: 37, y: 33, size: 1, tone: "#4C4C5E" },
    { x: 41, y: 11, size: 1, tone: "#34343E" },
    { x: 45, y: 27, size: 2, tone: "#4C4C5E" },
    { x: 49, y: 5, size: 1, tone: "#34343E" },
    { x: 52, y: 38, size: 1, tone: "#34343E", twinkle: 3.1 },
    { x: 56, y: 18, size: 1, tone: "#4C4C5E" },
    { x: 60, y: 29, size: 1, tone: "#34343E" },
    { x: 63, y: 9, size: 2, tone: "#4C4C5E" },
    { x: 67, y: 24, size: 1, tone: "#34343E" },
    { x: 71, y: 36, size: 1, tone: "#34343E" },
    { x: 74, y: 14, size: 1, tone: "#8D86C9", twinkle: 4.4 },
    { x: 78, y: 31, size: 1, tone: "#34343E" },
    { x: 81, y: 7, size: 1, tone: "#4C4C5E" },
    { x: 85, y: 21, size: 2, tone: "#4C4C5E" },
    { x: 88, y: 39, size: 1, tone: "#34343E" },
    { x: 92, y: 16, size: 1, tone: "#34343E", twinkle: 2.2 },
    { x: 95, y: 28, size: 1, tone: "#4C4C5E" },
    { x: 7, y: 48, size: 1, tone: "#34343E" },
    { x: 19, y: 52, size: 1, tone: "#34343E" },
    { x: 31, y: 46, size: 1, tone: "#34343E" },
    { x: 43, y: 54, size: 1, tone: "#34343E" },
    { x: 58, y: 47, size: 1, tone: "#34343E" },
    { x: 69, y: 53, size: 1, tone: "#34343E" },
    { x: 83, y: 49, size: 1, tone: "#34343E" },
    { x: 96, y: 44, size: 1, tone: "#34343E" },
    { x: 2, y: 25, size: 1, tone: "#34343E" },
    { x: 47, y: 42, size: 1, tone: "#34343E" },
    { x: 90, y: 4, size: 1, tone: "#34343E" },
    { x: 24, y: 30, size: 1, tone: "#34343E" },
    { x: 65, y: 41, size: 1, tone: "#34343E" },
    { x: 11, y: 19, size: 1, tone: "#4C4C5E" },
    { x: 99, y: 33, size: 1, tone: "#34343E" },
];

export default function SkyLayer({ windX }: { windX: MotionValue<number> }) {
    const driftX = useTransform(windX, (v) => -v * 0.02);

    return (
        <div className="absolute inset-0">
            <motion.div className="absolute inset-0" style={{ x: driftX }}>
                {STARS.map((star, i) => (
                    <motion.span
                        key={i}
                        className="absolute"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: star.size,
                            height: star.size,
                            backgroundColor: star.tone,
                        }}
                        animate={
                            star.twinkle !== undefined
                                ? { opacity: [1, 1, 0.15, 0.15, 1, 1] }
                                : undefined
                        }
                        transition={
                            star.twinkle !== undefined
                                ? {
                                      duration: 3.6,
                                      times: [0, 0.42, 0.42, 0.58, 0.58, 1],
                                      repeat: Infinity,
                                      delay: star.twinkle,
                                      ease: "linear",
                                  }
                                : undefined
                        }
                    />
                ))}
            </motion.div>
            <MoonSprite className="absolute top-[12%] right-[14%] w-9" />
        </div>
    );
}
