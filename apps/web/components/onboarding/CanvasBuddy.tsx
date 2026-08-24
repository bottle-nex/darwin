import "./CanvasBuddy.css";

import { cn } from "@/lib/utils";

const BODY = "var(--color-primary)";
const EYE = "#262626";
const CAP = "#6C55DE";

export type BuddyPose = "run" | "idle" | "cheer";

export default function CanvasBuddy({ pose, className }: { pose: BuddyPose; className?: string }) {
    return (
        <span aria-hidden className={cn("cb inline-flex", `cb-${pose}`, className)}>
            <svg
                viewBox="0 0 18 11"
                shapeRendering="crispEdges"
                className="h-full w-full overflow-visible"
            >
                <g className="cb-figure">
                    <g fill={BODY}>
                        <g className="cb-arm-l">
                            <rect x="5" y="3" width="1" height="1" />
                            <rect x="4" y="2" width="1" height="1" />
                            <rect x="3" y="1" width="1" height="1" />
                            <rect x="2" y="0" width="1" height="2" />
                            <rect x="3" y="6" width="2" height="1" />
                            <rect x="2" y="7" width="1" height="1" />
                            <rect x="1" y="8" width="1" height="2" />
                        </g>
                        <g className="cb-leg-l">
                            <rect x="3" y="4" width="3" height="1" />
                            <rect x="2" y="5" width="1" height="1" />
                            <rect x="1" y="5" width="1" height="2" />
                            <rect x="5" y="8" width="1" height="1" />
                            <rect x="4" y="9" width="1" height="1" />
                            <rect x="3" y="9" width="1" height="2" />
                        </g>
                        <g className="cb-arm-r">
                            <rect x="12" y="3" width="1" height="1" />
                            <rect x="13" y="2" width="1" height="1" />
                            <rect x="14" y="1" width="1" height="1" />
                            <rect x="15" y="0" width="1" height="2" />
                            <rect x="13" y="6" width="2" height="1" />
                            <rect x="15" y="7" width="1" height="1" />
                            <rect x="16" y="8" width="1" height="2" />
                        </g>
                        <g className="cb-leg-r">
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
                    <g fill={CAP}>
                        <rect x="6" y="0" width="6" height="2" />
                        <rect x="12" y="1" width="1" height="1" />
                    </g>
                    <g fill={EYE}>
                        <rect x="6" y="3" width="1" height="1" />
                        <rect x="11" y="3" width="1" height="1" />
                        <rect className="cb-eye" x="7" y="4" width="1" height="2" />
                        <rect className="cb-eye" x="10" y="4" width="1" height="2" />
                    </g>
                </g>
            </svg>
        </span>
    );
}
