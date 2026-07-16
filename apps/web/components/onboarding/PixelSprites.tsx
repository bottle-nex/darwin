import type { CSSProperties } from "react";

type SpriteProps = { className?: string; style?: CSSProperties };

export function CactusSprite({ className, style }: SpriteProps) {
    return (
        <svg
            viewBox="0 0 11 12"
            shapeRendering="crispEdges"
            className={className}
            style={style}
            aria-hidden
        >
            <g fill="#3F3956">
                <rect x="4" y="0" width="3" height="12" />
                <rect x="0" y="2" width="2" height="4" />
                <rect x="2" y="4" width="2" height="2" />
                <rect x="9" y="3" width="2" height="3" />
                <rect x="7" y="4" width="2" height="2" />
            </g>
            <g fill="#322D45">
                <rect x="6" y="0" width="1" height="12" />
                <rect x="10" y="3" width="1" height="3" />
                <rect x="1" y="5" width="1" height="1" />
            </g>
        </svg>
    );
}

export function MoonSprite({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 9 9" shapeRendering="crispEdges" className={className} aria-hidden>
            <g fill="#E9E7F5">
                <rect x="3" y="0" width="3" height="1" />
                <rect x="2" y="1" width="5" height="1" />
                <rect x="1" y="2" width="7" height="1" />
                <rect x="0" y="3" width="9" height="3" />
                <rect x="1" y="6" width="7" height="1" />
                <rect x="2" y="7" width="5" height="1" />
                <rect x="3" y="8" width="3" height="1" />
            </g>
            <g fill="#C9C4E6">
                <rect x="3" y="3" width="2" height="1" />
                <rect x="5" y="5" width="1" height="1" />
                <rect x="2" y="6" width="1" height="1" />
                <rect x="6" y="2" width="1" height="1" />
            </g>
        </svg>
    );
}

export function GrassTuft({ className, style }: SpriteProps) {
    return (
        <svg
            viewBox="0 0 5 3"
            shapeRendering="crispEdges"
            className={className}
            style={style}
            aria-hidden
        >
            <g fill="#23232B">
                <rect x="0" y="1" width="1" height="2" />
                <rect x="2" y="0" width="1" height="3" />
                <rect x="4" y="1" width="1" height="2" />
            </g>
        </svg>
    );
}

export function PebbleSprite({ className, style }: SpriteProps) {
    return (
        <svg
            viewBox="0 0 3 2"
            shapeRendering="crispEdges"
            className={className}
            style={style}
            aria-hidden
        >
            <g fill="#35304F">
                <rect x="1" y="0" width="1" height="1" />
                <rect x="0" y="1" width="3" height="1" />
            </g>
        </svg>
    );
}

export function FlagSprite({ active, className }: { active: boolean; className?: string }) {
    return (
        <svg viewBox="0 0 8 12" shapeRendering="crispEdges" className={className} aria-hidden>
            <rect x="0" y="0" width="1" height="12" fill={active ? "#6E6E7A" : "#26262B"} />
            <g fill={active ? "#AB9FF2" : "#1E1E23"}>
                <rect x="1" y="1" width="5" height="1" />
                <rect x="1" y="2" width="4" height="1" />
                <rect x="1" y="3" width="2" height="1" />
            </g>
        </svg>
    );
}

export function SaguaroSilhouette({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 10 24" shapeRendering="crispEdges" className={className} aria-hidden>
            <g fill="#0A0A0C">
                <rect x="4" y="0" width="2" height="24" />
                <rect x="0" y="6" width="2" height="7" />
                <rect x="2" y="11" width="2" height="2" />
                <rect x="8" y="3" width="2" height="8" />
                <rect x="6" y="9" width="2" height="2" />
            </g>
        </svg>
    );
}
