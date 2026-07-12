"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import "./HeroBuddy.css";

const BODY = "#AB9FF2";
const EYE = "#262626";
const CAP = "#6C55DE";

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
            <svg viewBox="0 0 16 11" shapeRendering="crispEdges" className="buddy-sprite">
                <g className="buddy-figure">
                    <g className="buddy-trick">
                        <g fill={BODY}>
                            <rect x="7" y="0" width="2" height="1" />
                            <rect className="buddy-leg-l" x="4" y="8" width="2" height="2" />
                            <rect className="buddy-leg-r" x="10" y="8" width="2" height="2" />
                            <rect className="buddy-arm-l" x="1" y="3" width="2" height="2" />
                            <rect className="buddy-arm-r" x="13" y="3" width="2" height="2" />
                            <rect x="4" y="1" width="8" height="1" />
                            <rect x="3" y="2" width="10" height="6" />
                        </g>
                        <g className="buddy-cap" fill={CAP}>
                            <rect x="5" y="-1" width="6" height="2" />
                            <rect x="11" y="0" width="2" height="1" />
                        </g>
                        <g className="buddy-eyes" fill={EYE}>
                            <rect className="buddy-eye" x="5" y="4" width="1" height="2" />
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
