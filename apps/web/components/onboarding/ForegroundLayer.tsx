"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { SaguaroSilhouette } from "./PixelSprites";

const TILE_WIDTH = 1440;
const TILE_COUNT = 3;

export default function ForegroundLayer({ worldX }: { worldX: MotionValue<number> }) {
    const x = useTransform(worldX, (v) => -((v * 1.35) % TILE_WIDTH));

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-[14%] h-[34vh]">
            <motion.div className="absolute bottom-0 left-0 flex h-full" style={{ x }}>
                {Array.from({ length: TILE_COUNT }, (_, i) => (
                    <div key={i} className="relative h-full w-[1440px] shrink-0">
                        <SaguaroSilhouette className="absolute bottom-0 left-[820px] h-full w-auto" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
