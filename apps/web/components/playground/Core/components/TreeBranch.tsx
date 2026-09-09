"use client";
import { cn } from "@/lib/utils";

const WIDTH = 16;
const HEIGHT = 32;
const STEM_X = 7.5;
const TICK_Y = HEIGHT / 2;
const TICK_END = 14;
const CORNER = 4;

const ELBOW = `M${STEM_X} 0V${TICK_Y - CORNER}a${CORNER} ${CORNER} 0 0 0 ${CORNER} ${CORNER}H${TICK_END}`;
const SPINE = `M${STEM_X} 0V${HEIGHT}`;

export default function TreeBranch({ last, className }: { last: boolean; className?: string }) {
    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
            style={{ width: WIDTH, height: "100%" }}
            className={cn("pointer-events-none absolute top-0 left-2.5 text-overlay/20", className)}
        >
            <path
                d={last ? ELBOW : `${ELBOW} ${SPINE}`}
                stroke="currentColor"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
