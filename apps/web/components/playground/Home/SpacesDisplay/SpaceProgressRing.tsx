"use client";
import { cn } from "@/lib/utils";

const SIZE = 14;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SpaceProgressRing({
    ratio,
    className,
}: {
    ratio: number;
    className?: string;
}) {
    const filled = Math.max(0, Math.min(1, ratio));

    return (
        <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className={cn("shrink-0 -rotate-90", className)}
            aria-hidden
        >
            <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                className="stroke-white/15"
            />
            <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
                className="stroke-primary transition-[stroke-dashoffset] duration-300"
            />
        </svg>
    );
}
