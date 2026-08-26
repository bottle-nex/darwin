"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import CanvasBuddy, { type BuddyPose } from "./CanvasBuddy";
import { JUMP_DELAY_MS } from "./choreography";
import DustTrail from "./DustTrail";

export default function BuddyRunner({
    jumpSignal,
    pose,
    dustActive,
}: {
    jumpSignal: number;
    pose: BuddyPose;
    dustActive: boolean;
}) {
    const [scope, animate] = useAnimate();
    const reduced = useReducedMotion();

    useEffect(() => {
        if (!jumpSignal || reduced) return;
        const id = window.setTimeout(async () => {
            await animate(
                scope.current,
                { y: [0, -100, 0] },
                { duration: 0.55, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] },
            );
            await animate(
                scope.current,
                { scaleY: [0.88, 1], scaleX: [1.08, 1] },
                { duration: 0.12, ease: "easeOut" },
            );
        }, JUMP_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [jumpSignal, animate, scope, reduced]);

    return (
        <div ref={scope} className="relative h-15.25 w-25 origin-bottom">
            {dustActive && !reduced && <DustTrail />}
            <CanvasBuddy pose={pose} className="h-full w-full" />
        </div>
    );
}
