"use client";

import { useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { useRef } from "react";

import BuddyRunner from "./BuddyRunner";
import type { BuddyPose } from "./CanvasBuddy";
import { SPEED, SPEED_LERP, type SpeedTarget, WIND_SPEED } from "./choreography";
import ForegroundLayer from "./ForegroundLayer";
import MountainLayer from "./MountainLayer";
import SkyLayer from "./SkyLayer";
import TerrainLayer from "./TerrainLayer";

export default function TourScene({
    speedTarget,
    jumpSignal,
    pose,
}: {
    speedTarget: SpeedTarget;
    jumpSignal: number;
    pose: BuddyPose;
}) {
    const worldX = useMotionValue(0);
    const windX = useMotionValue(0);
    const speed = useRef(SPEED.jog);
    const reduced = useReducedMotion();

    useAnimationFrame((_, delta) => {
        if (reduced) return;
        const dt = Math.min(delta, 64) / 1000;
        speed.current += (SPEED[speedTarget] - speed.current) * Math.min(1, dt * SPEED_LERP);
        worldX.set(worldX.get() + speed.current * dt);
        windX.set(windX.get() + WIND_SPEED * dt);
    });

    return (
        <div className="absolute inset-0 overflow-hidden">
            <SkyLayer windX={windX} />
            <MountainLayer worldX={worldX} variant="far" />
            <MountainLayer worldX={worldX} variant="near" />
            <TerrainLayer worldX={worldX} />
            <div className="absolute bottom-[18%] left-[58%]">
                <BuddyRunner
                    jumpSignal={jumpSignal}
                    pose={pose}
                    dustActive={speedTarget === "sprint"}
                />
            </div>
            <ForegroundLayer worldX={worldX} />
        </div>
    );
}
