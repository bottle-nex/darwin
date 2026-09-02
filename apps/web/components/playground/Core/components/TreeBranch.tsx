"use client";

const WIDTH = 16;
const HEIGHT = 28;
const STEM_X = 7.5;
const TICK_Y = 14.5;
const TICK_END = 14;
const CORNER = 4;

const ELBOW = `M${STEM_X} 0V${TICK_Y - CORNER}a${CORNER} ${CORNER} 0 0 0 ${CORNER} ${CORNER}H${TICK_END}`;
const SPINE = `M${STEM_X} 0V${HEIGHT}`;

export default function TreeBranch({ last }: { last: boolean }) {
    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
            style={{ width: WIDTH }}
            className="pointer-events-none absolute inset-y-0 left-2.5 text-snow/20"
        >
            <path
                d={last ? ELBOW : `${ELBOW}${SPINE}`}
                stroke="currentColor"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
