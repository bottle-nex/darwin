"use client";

import { cn } from "@/lib/utils";
import { useAnimationControls, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface DialProps {
    size?: number;
    color?: string;
    padding?: number;
    tick?: {
        count?: number;
        size?: number;
        color?: string;
        width?: number;
        className?: string;
        opacity?: number;
    };
    shadow?: {
        x?: number;
        y?: number;
        blur?: number;
        color?: string;
    };
    rotation?: {
        angle?: number;
        interval?: number;
        direction?: "clockwise" | "counterclockwise";
    };
    className?: string;
}

export default function Dial({
    size = 500,
    color = "#c4c6e8",
    padding,
    tick,
    shadow,
    rotation,
    className,
}: DialProps) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;

    const tickLen = tick?.size ?? size * 0.04;
    const tickCount = tick?.count ?? 80;
    const dialPadding = padding ?? size * 0.03;

    const shadowX = shadow?.x ?? 0;
    const shadowY = shadow?.y ?? 0;
    const shadowBlur = shadow?.blur ?? 20;
    const shadowColor = shadow?.color ?? "rgba(0,0,0,0.4)";

    const controls = useAnimationControls();
    const currentAngle = useRef(0);

    useEffect(() => {
        if (!rotation) return;

        const step = rotation.angle ?? 6;
        const interval = (rotation.interval ?? 1) * 1000;
        const signed = rotation.direction === "counterclockwise" ? -step : step;

        const id = setInterval(() => {
            currentAngle.current += signed;
            controls.start({
                rotate: currentAngle.current,
                transition: { duration: 0.3, ease: "easeOut" },
            });
        }, interval);

        return () => clearInterval(id);
    }, [rotation?.angle, rotation?.interval, rotation?.direction]);

    const ticks = Array.from({ length: tickCount }, (_, i) => {
        const angle = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
        const outerR = r - dialPadding;
        const innerR = outerR - tickLen;

        return {
            x1: cx + innerR * Math.cos(angle),
            y1: cy + innerR * Math.sin(angle),
            x2: cx + outerR * Math.cos(angle),
            y2: cy + outerR * Math.sin(angle),
        };
    });

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            overflow="visible"
            className={cn(className)}
            animate={controls}
            style={
                shadow
                    ? {
                          filter: `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor})`,
                      }
                    : undefined
            }
        >
            <circle cx={cx} cy={cy} r={r} fill={color} />
            {ticks.map((t, i) => (
                <line
                    key={i}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={tick?.color ?? "#ffffff"}
                    strokeWidth={tick?.width ?? 1.5}
                    strokeOpacity={tick?.opacity ?? 0.6}
                    strokeLinecap="round"
                    className={tick?.className}
                />
            ))}
        </motion.svg>
    );
}
