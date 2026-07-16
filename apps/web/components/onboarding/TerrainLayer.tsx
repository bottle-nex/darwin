"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { CactusSprite, GrassTuft, PebbleSprite } from "./PixelSprites";

const TILE_WIDTH = 600;
const TILE_COUNT = 7;

const TILE_PROPS = [
    { cactus: { left: 90, height: 44 }, grass: [220, 470], pebbles: [320, 550] },
    { cactus: { left: 380, height: 30 }, grass: [60, 300], pebbles: [180, 500] },
    { cactus: null, grass: [140, 420, 560], pebbles: [40, 260] },
];

export default function TerrainLayer({ worldX }: { worldX: MotionValue<number> }) {
    const pattern = TILE_WIDTH * TILE_PROPS.length;
    const x = useTransform(worldX, (v) => -(v % pattern));
    const ditherX = useTransform(worldX, (v) => `${-v}px`);

    return (
        <div className="absolute inset-x-0 bottom-0 h-[18%]">
            <div className="absolute inset-0 bg-[#0D0D10]" />
            <div className="absolute inset-x-0 top-0 h-0.5 bg-[#2A2A31]" />
            <motion.div
                className="absolute inset-x-0 top-0.5 h-[3px]"
                style={{
                    backgroundPositionX: ditherX,
                    backgroundImage:
                        "repeating-linear-gradient(90deg, #1C1C22 0 3px, transparent 3px 11px)",
                }}
            />
            <motion.div
                className="absolute inset-x-0 top-2 h-[2px]"
                style={{
                    backgroundPositionX: ditherX,
                    backgroundImage:
                        "repeating-linear-gradient(90deg, #16161B 0 4px, transparent 4px 23px)",
                }}
            />
            <motion.div className="absolute bottom-full left-0 flex" style={{ x }}>
                {Array.from({ length: TILE_COUNT }, (_, i) => {
                    const tile = TILE_PROPS[i % TILE_PROPS.length];
                    return (
                        <div key={i} className="relative h-14 w-[600px] shrink-0">
                            {tile.cactus && (
                                <CactusSprite
                                    className="absolute bottom-0 w-auto"
                                    style={{ left: tile.cactus.left, height: tile.cactus.height }}
                                />
                            )}
                            {tile.grass.map((left) => (
                                <GrassTuft
                                    key={left}
                                    className="absolute bottom-0 h-[9px] w-auto"
                                    style={{ left }}
                                />
                            ))}
                            {tile.pebbles.map((left) => (
                                <PebbleSprite
                                    key={left}
                                    className="absolute bottom-0 h-[6px] w-auto"
                                    style={{ left }}
                                />
                            ))}
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}
