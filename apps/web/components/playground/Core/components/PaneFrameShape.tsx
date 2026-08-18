"use client";
import { useId } from "react";

export const PANE_FRAME_NOTCH_HEIGHT = 42;

const CORNER_RADIUS = 10;
const NOTCH_SLOPE_RUN = 32;
const NOTCH_CORNER = 6;

export const PANE_FRAME_SLANT_WIDTH = NOTCH_SLOPE_RUN + NOTCH_CORNER;

function buildFrameOutline(width: number, height: number, notchWidth: number) {
    const radius = CORNER_RADIUS;
    const notchHeight = PANE_FRAME_NOTCH_HEIGHT;
    const slopeEnd = Math.min(
        width - radius - NOTCH_CORNER,
        Math.max(radius + NOTCH_SLOPE_RUN + NOTCH_CORNER, width - notchWidth),
    );
    const slopeStart = slopeEnd - NOTCH_SLOPE_RUN;
    const slopeLength = Math.hypot(NOTCH_SLOPE_RUN, notchHeight);
    const cornerX = (NOTCH_CORNER * NOTCH_SLOPE_RUN) / slopeLength;
    const cornerY = (NOTCH_CORNER * notchHeight) / slopeLength;

    return [
        `M ${radius} 0`,
        `H ${slopeStart - NOTCH_CORNER}`,
        `Q ${slopeStart} 0 ${slopeStart + cornerX} ${cornerY}`,
        `L ${slopeEnd - cornerX} ${notchHeight - cornerY}`,
        `Q ${slopeEnd} ${notchHeight} ${slopeEnd + NOTCH_CORNER} ${notchHeight}`,
        `H ${width - radius}`,
        `A ${radius} ${radius} 0 0 1 ${width} ${notchHeight + radius}`,
        `V ${height - radius}`,
        `A ${radius} ${radius} 0 0 1 ${width - radius} ${height}`,
        `H ${radius}`,
        `A ${radius} ${radius} 0 0 1 0 ${height - radius}`,
        `V ${radius}`,
        `A ${radius} ${radius} 0 0 1 ${radius} 0`,
        "Z",
    ].join(" ");
}

export default function PaneFrameShape({
    width,
    height,
    notchWidth,
    className,
}: {
    width: number;
    height: number;
    notchWidth: number;
    className?: string;
}) {
    const instanceId = useId();

    if (width <= 0 || height <= 0) return null;

    const clipId = `pane-frame-${instanceId.replace(/[^a-zA-Z0-9]/g, "")}`;
    const outline = buildFrameOutline(width, height, notchWidth);

    return (
        <svg
            aria-hidden
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <clipPath id={clipId}>
                    <path d={outline} />
                </clipPath>
            </defs>
            <path d={outline} className="fill-charcoal" />
            <path
                d={outline}
                clipPath={`url(#${clipId})`}
                strokeWidth={1.5}
                className="fill-none stroke-white/8"
            />
        </svg>
    );
}
