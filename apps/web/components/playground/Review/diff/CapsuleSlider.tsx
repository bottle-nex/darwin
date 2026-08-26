"use client";
import { type ReactNode, useRef, useState } from "react";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { cn } from "@/lib/utils";

const KEYBOARD_STEP = 2;
const MIN_POSITION = 2;
const MAX_POSITION = 98;

function clamp(position: number): number {
    return Math.min(MAX_POSITION, Math.max(MIN_POSITION, position));
}

/**
 * Wipes between the two revisions instead of setting them side by side.
 *
 * Both panes stay mounted at the same size and the top one is clipped rather than resized, so
 * neither reflows while the handle moves — and a clipped region stops answering pointer events,
 * which leaves the left half interactive as Before and the right half as After.
 */
export default function CapsuleSlider({
    before,
    after,
    height,
    width,
}: {
    before: ReactNode;
    after: ReactNode;
    height: number;
    width: number | null;
}) {
    const [position, setPosition] = useState(50);
    const track = useRef<HTMLDivElement>(null);

    function positionFrom(clientX: number): number {
        const bounds = track.current?.getBoundingClientRect();
        if (!bounds || bounds.width === 0) return position;
        return clamp(((clientX - bounds.left) / bounds.width) * 100);
    }

    function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);
        setPosition(positionFrom(event.clientX));
    }

    function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        setPosition(positionFrom(event.clientX));
    }

    function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.releasePointerCapture(event.pointerId);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === "ArrowLeft") setPosition((current) => clamp(current - KEYBOARD_STEP));
        else if (event.key === "ArrowRight") setPosition((current) => clamp(current + KEYBOARD_STEP));
        else if (event.key === "Home") setPosition(MIN_POSITION);
        else if (event.key === "End") setPosition(MAX_POSITION);
        else return;
        event.preventDefault();
    }

    return (
        <div
            ref={track}
            className="relative isolate mx-auto"
            style={{ height, width: width ?? undefined }}
        >
            <div className="absolute inset-0">{after}</div>
            <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
                {before}
            </div>

            <Edge label="Before" className="left-3" hidden={position < 12} />
            <Edge label="After" className="right-3" hidden={position > 88} />

            <div
                role="slider"
                aria-label="Compare before and after"
                aria-orientation="vertical"
                aria-valuemin={MIN_POSITION}
                aria-valuemax={MAX_POSITION}
                aria-valuenow={Math.round(position)}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={onKeyDown}
                style={{ left: `${position}%` }}
                className="group absolute inset-y-0 z-10 -ml-3 w-6 cursor-col-resize touch-none outline-none"
            >
                <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-snow/40 transition-colors group-hover:bg-snow/70 group-focus-visible:bg-primary" />
                <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-graphite shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                    <span className="h-2.5 w-px bg-snow/60" />
                    <span className="ml-0.5 h-2.5 w-px bg-snow/60" />
                </span>
            </div>
        </div>
    );
}

function Edge({
    label,
    className,
    hidden,
}: {
    label: string;
    className: string;
    hidden: boolean;
}) {
    return (
        <span
            className={cn(
                "pointer-events-none absolute top-3 z-10 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm transition-opacity",
                MICRO_LABEL,
                className,
                hidden && "opacity-0",
            )}
        >
            {label}
        </span>
    );
}
