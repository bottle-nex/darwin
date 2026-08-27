import type { ReactNode } from "react";
import type { IconBaseProps } from "react-icons";

const CENTER = 8;
const STROKE = 1.5;
const RING_RADIUS = 6.25;
const DISC_RADIUS = 6.75;
const PIE_RADIUS = 2.25;
const PIE_WIDTH = 4.5;
const PIE_SWEEP = 2 * Math.PI * PIE_RADIUS;
const UPRIGHT = `rotate(-90 ${CENTER} ${CENTER})`;

const ring = {
    cx: CENTER,
    cy: CENTER,
    r: RING_RADIUS,
    stroke: "currentColor",
    strokeWidth: STROKE,
} as const;

const disc = {
    cx: CENTER,
    cy: CENTER,
    r: DISC_RADIUS,
    fill: "currentColor",
} as const;

const mark = {
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

const markOnDisc = { ...mark, stroke: "var(--color-ink)" } as const;

function filled(portion: number) {
    return {
        cx: CENTER,
        cy: CENTER,
        r: PIE_RADIUS,
        stroke: "currentColor",
        strokeWidth: PIE_WIDTH,
        strokeDasharray: `${(PIE_SWEEP * portion).toFixed(2)} ${PIE_SWEEP.toFixed(2)}`,
        transform: UPRIGHT,
    };
}

function StatusGlyph({
    size,
    color,
    title,
    children,
    ...props
}: IconBaseProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 16 16"
            width={size ?? "1em"}
            height={size ?? "1em"}
            fill="none"
            color={color}
            focusable="false"
            aria-hidden={title ? undefined : true}
            {...props}
        >
            {title ? <title>{title}</title> : null}
            {children}
        </svg>
    );
}

export function TodoGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
        </StatusGlyph>
    );
}

export function QueuedGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle
                {...ring}
                strokeLinecap="round"
                strokeDasharray="0.9 4.01"
                transform={UPRIGHT}
            />
        </StatusGlyph>
    );
}

export function InProgressGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <circle {...filled(0.5)} />
        </StatusGlyph>
    );
}

export function InReviewGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <circle {...filled(0.75)} />
        </StatusGlyph>
    );
}

export function DoneGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...disc} />
            <path d="M5.2 8.2 L7.1 10.1 L11 6" {...markOnDisc} />
        </StatusGlyph>
    );
}

export function FailedGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...disc} />
            <path d="M5.9 5.9 L10.1 10.1 M10.1 5.9 L5.9 10.1" {...markOnDisc} />
        </StatusGlyph>
    );
}

export function CancelledGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <path d="M5.2 5.2 L10.8 10.8" {...mark} />
        </StatusGlyph>
    );
}

export function OffBoardGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <path d="M6.6 5.9 L6.6 10.1 M9.4 5.9 L9.4 10.1" {...mark} />
        </StatusGlyph>
    );
}
