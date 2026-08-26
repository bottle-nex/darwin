"use client";

import { motion, type MotionValue, useTransform } from "motion/react";

const TILE_WIDTH = 720;
const TILE_COUNT = 5;

const FAR_RIDGE =
    "0,40 0,22 8,22 8,16 14,16 14,10 20,10 20,16 28,16 28,24 38,24 38,18 46,18 46,12 52,12 52,6 58,6 58,12 66,12 66,20 76,20 76,26 88,26 88,18 96,18 96,12 102,12 102,18 110,18 110,24 120,24 120,16 128,16 128,8 134,8 134,16 142,16 142,22 152,22 152,28 162,28 162,20 170,20 170,26 180,26 180,40";

const NEAR_MESAS = [
    "0,28 0,14 4,14 4,10 24,10 24,14 28,14 28,28",
    "52,28 52,12 56,12 56,8 80,8 80,12 84,12 84,28",
    "112,28 112,16 116,16 116,12 140,12 140,16 144,16 144,28",
    "160,28 160,18 164,18 164,14 176,14 176,18 180,18 180,28",
];

const VARIANTS = {
    far: {
        fill: "#101014",
        factor: 0.08,
        height: "h-40",
        viewBox: "0 0 180 40",
        polygons: [FAR_RIDGE],
    },
    near: {
        fill: "#16161B",
        factor: 0.25,
        height: "h-28",
        viewBox: "0 0 180 28",
        polygons: NEAR_MESAS,
    },
} as const;

export default function MountainLayer({
    worldX,
    variant,
}: {
    worldX: MotionValue<number>;
    variant: keyof typeof VARIANTS;
}) {
    const { fill, factor, height, viewBox, polygons } = VARIANTS[variant];
    const x = useTransform(worldX, (v) => -((v * factor) % TILE_WIDTH));

    return (
        <div className={`absolute inset-x-0 bottom-[18%] ${height} overflow-hidden`}>
            <motion.div className="absolute bottom-0 left-0 flex h-full" style={{ x }}>
                {Array.from({ length: TILE_COUNT }, (_, i) => (
                    <svg
                        key={i}
                        viewBox={viewBox}
                        preserveAspectRatio="none"
                        shapeRendering="crispEdges"
                        className="h-full w-[720px] shrink-0"
                    >
                        {polygons.map((points) => (
                            <polygon key={points} points={points} fill={fill} />
                        ))}
                    </svg>
                ))}
            </motion.div>
        </div>
    );
}
