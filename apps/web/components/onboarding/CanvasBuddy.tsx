import { cn } from "@/lib/utils";
import "./CanvasBuddy.css";

const BODY = "#AB9FF2";
const EYE = "#262626";
const CAP = "#6C55DE";

export type BuddyPose = "run" | "idle" | "cheer";

export default function CanvasBuddy({ pose, className }: { pose: BuddyPose; className?: string }) {
    return (
        <span aria-hidden className={cn("cb inline-flex", `cb-${pose}`, className)}>
            <svg
                viewBox="0 0 16 11"
                shapeRendering="crispEdges"
                className="h-full w-full overflow-visible"
            >
                <g className="cb-figure">
                    <g fill={BODY}>
                        <rect x="7" y="0" width="2" height="1" />
                        <rect className="cb-leg-l" x="4" y="8" width="2" height="2" />
                        <rect className="cb-leg-r" x="10" y="8" width="2" height="2" />
                        <rect className="cb-arm-l" x="1" y="3" width="2" height="2" />
                        <rect className="cb-arm-r" x="13" y="3" width="2" height="2" />
                        <rect x="4" y="1" width="8" height="1" />
                        <rect x="3" y="2" width="10" height="6" />
                    </g>
                    <g fill={CAP}>
                        <rect x="5" y="-1" width="6" height="2" />
                        <rect x="11" y="0" width="2" height="1" />
                    </g>
                    <g fill={EYE}>
                        <rect className="cb-eye" x="5" y="4" width="1" height="2" />
                        <rect className="cb-eye" x="10" y="4" width="1" height="2" />
                    </g>
                </g>
            </svg>
        </span>
    );
}
