import { useId } from "react";
import type { ReactNode } from "react";
import type { IconBaseProps } from "react-icons";

const CENTER = 8;
const STROKE = 1.5;
const RING_RADIUS = 6.25;
const DISC_RADIUS = 6.75;
const INNER_RADIUS = 4;
const PIE_RADIUS = INNER_RADIUS / 2;
const PIE_SWEEP = 2 * Math.PI * PIE_RADIUS;
const UPRIGHT = `rotate(-90 ${CENTER} ${CENTER})`;

const ring = {
    cx: CENTER,
    cy: CENTER,
    r: RING_RADIUS,
    stroke: "currentColor",
    strokeWidth: STROKE,
} as const;

const mark = {
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

function filled(portion: number) {
    return {
        cx: CENTER,
        cy: CENTER,
        r: PIE_RADIUS,
        stroke: "currentColor",
        strokeWidth: INNER_RADIUS,
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

const CHECK = "M5.45 8.3 L7.1 9.9 L10.6 6";

export function DoneGlyph(props: IconBaseProps) {
    const knockout = useId();
    return (
        <StatusGlyph {...props}>
            <mask id={knockout}>
                <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} fill="white" />
                <path d={CHECK} {...mark} stroke="black" />
            </mask>
            <circle
                cx={CENTER}
                cy={CENTER}
                r={DISC_RADIUS}
                fill="currentColor"
                mask={`url(#${knockout})`}
            />
        </StatusGlyph>
    );
}

export function FailedGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <path d="M5.7 5.7 L10.3 10.3 M10.3 5.7 L5.7 10.3" {...mark} />
        </StatusGlyph>
    );
}

export function CancelledGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <path d="M5.7 5.7 L10.3 10.3" {...mark} />
        </StatusGlyph>
    );
}

export function OffBoardGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <circle {...ring} />
            <path d="M6.5 5.4 L6.5 10.6 M9.5 5.4 L9.5 10.6" {...mark} />
        </StatusGlyph>
    );
}
