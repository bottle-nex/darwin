"use client";

import { AnimatePresence } from "framer-motion";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";

import TimelineStick from "./TimelineStick";
import type { PositionedNode } from "./types";

const TICK_WIDTH = 8;

const PADDING_TOP = 52;
const BASE_HEIGHT = 16;
const ACCENT_HEIGHT = 28;
const RULER_HEIGHT = PADDING_TOP + ACCENT_HEIGHT; // 80px

const BASE_COLOR = "#ea580c";

export interface TimelineMarker {
    minute: number;
    color: string;
    label?: string;
    dashed?: boolean;
}

interface TimelineProps {
    originMinute: number;
    endMinute: number;
    markers?: TimelineMarker[];
    children?: ReactNode;
    showCurrentTime?: boolean;
    hoveredNode?: PositionedNode | null;
    /** Pixel distance from the top of the .wf-ruler div to the bottom of the hovered row.
     *  Used to clip the response-period overlay so it doesn't bleed into rows below. */
    hoveredRowBottom?: number;
}

function getMask(fadeLeft: boolean, fadeRight: boolean): string | undefined {
    if (!fadeLeft && !fadeRight) return undefined;
    const stops: string[] = [];
    stops.push(fadeLeft ? "transparent 0%, black 8%" : "black 0%");
    stops.push(fadeRight ? "black 92%, transparent 100%" : "black 100%");
    return "linear-gradient(to right, " + stops.join(", ") + ")";
}

export default function Timeline({
    originMinute,
    endMinute,
    markers = [],
    children,
    showCurrentTime = true,
    hoveredNode,
    hoveredRowBottom,
}: TimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [fadeLeft, setFadeLeft] = useState(false);
    const [fadeRight, setFadeRight] = useState(false);

    const span = Math.max(1, Math.ceil(endMinute - originMinute));
    const totalWidth = span * TICK_WIDTH;

    const updateFade = () => {
        const el = scrollRef.current;
        if (!el) return;
        setFadeLeft(el.scrollLeft > 1);
        setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateFade();
        el.addEventListener("scroll", updateFade, { passive: true });
        const observer = new ResizeObserver(updateFade);
        observer.observe(el);
        return () => {
            el.removeEventListener("scroll", updateFade);
            observer.disconnect();
        };
    }, [span]);

    const markerMap = new Map(markers.map((m) => [Math.round(m.minute), m]));
    const labeled = markers.filter((m) => m.label);
    const mask = getMask(fadeLeft, fadeRight);

    // Duration label for response period hover overlay
    const isSec = originMinute > 1440;
    function fmtDur(ticks: number): string {
        if (isSec) return Math.round(ticks) + "s";
        return ticks < 60
            ? Math.round(ticks) + "m"
            : Math.floor(ticks / 60) + "h " + ((ticks % 60) | 0) + "m";
    }

    return (
        <div className="relative w-full select-none overflow-hidden">
            <div
                ref={scrollRef}
                className="overflow-x-scroll"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    ...(mask && { WebkitMaskImage: mask, maskImage: mask }),
                }}
            >
                <style>{`.wf-ruler::-webkit-scrollbar{display:none}`}</style>

                <div className="wf-ruler relative" style={{ width: totalWidth }}>
                    {/* Current-time stick with fade-out when all done */}
                    <AnimatePresence>
                        {showCurrentTime && (
                            <TimelineStick key="stick" originMinute={originMinute} />
                        )}
                    </AnimatePresence>

                    {/* Response period hover overlay — full-height dashed lines + shading */}
                    {hoveredNode?.responsePeriods?.map((period) => {
                        const nodeLeft = (hoveredNode.startAbs - originMinute) * TICK_WIDTH;
                        const startPx = nodeLeft + period.startOffset * TICK_WIDTH;
                        const endPx = nodeLeft + period.endOffset * TICK_WIDTH;
                        const midPx = (startPx + endPx) / 2;
                        const DASH =
                            "repeating-linear-gradient(to bottom, " +
                            period.color +
                            " 0px, " +
                            period.color +
                            " 4px, transparent 4px, transparent 8px)";
                        // Lines go from top of padding down to the hovered row only (not below)
                        const lineHeight = hoveredRowBottom ?? 9999;
                        const shadeHeight = Math.max(0, (hoveredRowBottom ?? 9999) - RULER_HEIGHT);

                        return (
                            <Fragment key={period.id}>
                                {/* Tinted region — clipped to hovered row, below ruler ticks */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: startPx,
                                        width: endPx - startPx,
                                        top: RULER_HEIGHT,
                                        height: shadeHeight,
                                        background: period.color + "18",
                                        zIndex: 8,
                                    }}
                                />
                                {/* Left dashed line — from very top to hovered row bottom */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: startPx,
                                        top: 0,
                                        height: lineHeight,
                                        width: 1,
                                        background: DASH,
                                        zIndex: 9,
                                    }}
                                />
                                {/* Right dashed line */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: endPx,
                                        top: 0,
                                        height: lineHeight,
                                        width: 1,
                                        background: DASH,
                                        zIndex: 9,
                                    }}
                                />
                                {/* Duration badge + label in PADDING_TOP space */}
                                <div
                                    className="absolute pointer-events-none flex flex-col items-center"
                                    style={{
                                        left: midPx,
                                        top: 26,
                                        transform: "translateX(-50%)",
                                        zIndex: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderLeft: "4px solid transparent",
                                            borderRight: "4px solid transparent",
                                            borderTop: "5px solid " + period.color,
                                            marginBottom: 2,
                                        }}
                                    />
                                    <div
                                        className="rounded-full text-white font-mono font-semibold whitespace-nowrap"
                                        style={{
                                            background: period.color,
                                            fontSize: 9,
                                            lineHeight: "16px",
                                            padding: "0 7px",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {fmtDur(period.endOffset - period.startOffset)}
                                    </div>
                                    <div
                                        className="text-white/50 font-mono whitespace-nowrap"
                                        style={{
                                            fontSize: 8,
                                            marginTop: 2,
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {period.label}
                                    </div>
                                </div>
                            </Fragment>
                        );
                    })}

                    {/* Boundary / labeled marker lines */}
                    {labeled.map((m) => (
                        <div
                            key={m.minute}
                            className="absolute top-0 bottom-0 pointer-events-none"
                            style={{
                                left: (m.minute - originMinute) * TICK_WIDTH + TICK_WIDTH / 2,
                                width: 1,
                                transform: "translateX(-50%)",
                                background: m.dashed
                                    ? "repeating-linear-gradient(to bottom, " +
                                      m.color +
                                      " 0px, " +
                                      m.color +
                                      " 4px, transparent 4px, transparent 8px)"
                                    : m.color,
                            }}
                        >
                            <div
                                className="absolute flex flex-col items-center"
                                style={{ top: 26, left: "50%", transform: "translateX(-50%)" }}
                            >
                                <div
                                    style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: "4px solid transparent",
                                        borderRight: "4px solid transparent",
                                        borderTop: "5px solid " + m.color,
                                        marginBottom: 2,
                                    }}
                                />
                                <div
                                    className="rounded-full text-white font-mono font-medium whitespace-nowrap"
                                    style={{
                                        background: m.color,
                                        fontSize: 9,
                                        lineHeight: "16px",
                                        padding: "0 7px",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {m.label}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Ruler row — one stick per tick */}
                    <div
                        data-timeline-ruler
                        className="relative"
                        style={{ height: RULER_HEIGHT, paddingTop: PADDING_TOP, zIndex: 1 }}
                    >
                        {Array.from({ length: span }, (_, i) => {
                            const absMinute = Math.round(originMinute) + i;
                            const marker = markerMap.get(absMinute);
                            if (marker?.label) return null;
                            const color = marker?.color ?? BASE_COLOR;
                            const height = marker ? ACCENT_HEIGHT : BASE_HEIGHT;
                            return (
                                <div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        top: PADDING_TOP,
                                        left: i * TICK_WIDTH + TICK_WIDTH / 2,
                                        width: 1.5,
                                        height,
                                        background: color,
                                        transform: "translateX(-50%)",
                                        borderRadius: 1,
                                    }}
                                />
                            );
                        })}
                    </div>

                    {children && (
                        <div className="pt-6" style={{ position: "relative", zIndex: 1 }}>
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
