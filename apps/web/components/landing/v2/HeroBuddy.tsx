"use client";
import "./HeroBuddy.css";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const BODY = "var(--color-primary)";
const EYE = "#262626";
const CAP = "#6C55DE";
const SILK = "#CFC8F7";

const CYCLE_MS = 32000;

export default function HeroBuddy({
    className,
    move = true,
}: {
    className?: string;
    move?: boolean;
}) {
    const [wearsCap, setWearsCap] = useState(true);
    useEffect(() => {
        const id = setInterval(() => setWearsCap(Math.random() < 0.5), CYCLE_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <span
            aria-hidden
            className={cn(
                "buddy inline-flex",
                !move && "buddy-anchored",
                !wearsCap && "buddy-capless",
                className,
            )}
        >
            <svg viewBox="0 0 18 11" shapeRendering="crispEdges" className="buddy-sprite">
                <g className="buddy-figure">
                    <rect
                        className="buddy-silk"
                        x="8.8"
                        y="-26"
                        width="0.4"
                        height="27"
                        fill={SILK}
                        shapeRendering="auto"
                    />
                    <g className="buddy-trick">
                        <g fill={BODY}>
                            <g className="buddy-arm-l">
                                <rect x="5" y="3" width="1" height="1" />
                                <rect x="4" y="2" width="1" height="1" />
                                <rect x="3" y="1" width="1" height="1" />
                                <rect x="2" y="0" width="1" height="2" />
                                <rect x="3" y="6" width="2" height="1" />
                                <rect x="2" y="7" width="1" height="1" />
                                <rect x="1" y="8" width="1" height="2" />
                            </g>
                            <g className="buddy-leg-l">
                                <rect x="3" y="4" width="3" height="1" />
                                <rect x="2" y="5" width="1" height="1" />
                                <rect x="1" y="5" width="1" height="2" />
                                <rect x="5" y="8" width="1" height="1" />
                                <rect x="4" y="9" width="1" height="1" />
                                <rect x="3" y="9" width="1" height="2" />
                            </g>
                            <g className="buddy-arm-r">
                                <rect x="12" y="3" width="1" height="1" />
                                <rect x="13" y="2" width="1" height="1" />
                                <rect x="14" y="1" width="1" height="1" />
                                <rect x="15" y="0" width="1" height="2" />
                                <rect x="13" y="6" width="2" height="1" />
                                <rect x="15" y="7" width="1" height="1" />
                                <rect x="16" y="8" width="1" height="2" />
                            </g>
                            <g className="buddy-leg-r">
                                <rect x="12" y="4" width="3" height="1" />
                                <rect x="15" y="5" width="1" height="1" />
                                <rect x="16" y="5" width="1" height="2" />
                                <rect x="12" y="8" width="1" height="1" />
                                <rect x="13" y="9" width="1" height="1" />
                                <rect x="14" y="9" width="1" height="2" />
                            </g>
                            <rect x="7" y="2" width="4" height="1" />
                            <rect x="6" y="3" width="6" height="2" />
                            <rect x="5" y="5" width="8" height="3" />
                            <rect x="6" y="8" width="6" height="1" />
                            <rect x="8" y="9" width="2" height="1" />
                        </g>
                        <g className="buddy-cap" fill={CAP}>
                            <rect x="6" y="0" width="6" height="2" />
                            <rect x="12" y="1" width="1" height="1" />
                        </g>
                        <g className="buddy-eyes" fill={EYE}>
                            <rect x="6" y="3" width="1" height="1" />
                            <rect x="11" y="3" width="1" height="1" />
                            <rect className="buddy-eye" x="7" y="4" width="1" height="2" />
                            <rect
                                className="buddy-eye buddy-eye-r"
                                x="10"
                                y="4"
                                width="1"
                                height="2"
                            />
                        </g>
                    </g>
                </g>
            </svg>
        </span>
    );
}
