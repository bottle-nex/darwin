"use client";
import { useEffect, useRef, useState } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import { LuMousePointer2, LuGrab } from "react-icons/lu";
import { useIssueFlightStore } from "@/store/kanban/useIssueFlightStore";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import TodoCard from "../cards/TodoCard";
import {
    locateCard,
    locateColumn,
    locateColumnList,
    locateScrollRow,
    rectCenter,
    viewportCenter,
    horizontalScrollDelta,
    verticalScrollDelta,
    animateScrollTo,
} from "./flightGeometry";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Renders the fake "drag cursor" that flies in from the screen's center, scrolls
 * the board to reveal a card, lifts a ghost clone of it, carries it to the target
 * column, and drops it — the real card dims like a dnd-kit drag source while it's
 * in the air (matching `DraggableIssue`'s convention) and actually lands in the
 * target column on drop via `useKanbanBoardStore`'s `moveIssue`, never through the
 * update-issue API. z-[100] is a deliberate new top tier — every dialog/popover in
 * this app tops out at z-50, and this needs to paint above a still-closing trigger
 * dialog.
 */
export default function IssueFlightOverlay() {
    const flight = useIssueFlightStore((s) => s.flight);
    const finish = useIssueFlightStore((s) => s.finish);
    const reduceMotion = useReducedMotion();
    const [scope, animate] = useAnimate();
    const cursorRef = useRef<HTMLDivElement>(null);
    const ghostRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const [holding, setHolding] = useState(false);

    useEffect(() => {
        if (!flight) return;
        const currentFlight = flight;
        const cancelledRef = { current: false };
        // Scaled, reduced-motion-aware milliseconds — for `animateScrollTo`, which
        // (like the DOM APIs it wraps) takes a duration in ms.
        const d = (ms: number) => (reduceMotion ? Math.max(40, Math.round(ms / 4)) : ms);
        // Same, but in seconds — Motion's `transition.duration` is always in
        // seconds, unlike every other duration in this file.
        const s = (ms: number) => d(ms) / 1000;

        async function fadeAway(cursor: HTMLElement, ghost: HTMLElement) {
            await Promise.all([
                animate(cursor, { opacity: 0 }, { duration: s(150) }),
                animate(ghost, { opacity: 0 }, { duration: s(150) }),
            ]);
        }

        async function run() {
            const cursor = cursorRef.current;
            const ghost = ghostRef.current;
            const highlight = highlightRef.current;
            if (!cursor || !ghost || !highlight) return;

            const center = viewportCenter();
            await animate(
                cursor,
                { x: center.x, y: center.y, opacity: 0, scale: 0.6 },
                { duration: 0 },
            );
            await animate(cursor, { opacity: 1, scale: 1 }, { duration: s(200), ease: EASE });
            if (cancelledRef.current) return;

            const cardEl = locateCard(currentFlight.issue.id);
            if (!cardEl) {
                await fadeAway(cursor, ghost);
                return;
            }

            const sourceColumnEl = cardEl.closest<HTMLElement>("[data-column-status]");
            const rowEl = locateScrollRow();
            if (sourceColumnEl && rowEl) {
                const delta = horizontalScrollDelta(sourceColumnEl, rowEl);
                if (delta !== null) await animateScrollTo(rowEl, "left", delta, d(450));
            }
            if (cancelledRef.current) return;

            const sourceListEl = sourceColumnEl ? locateColumnList(sourceColumnEl) : null;
            if (sourceListEl) {
                const delta = verticalScrollDelta(cardEl, sourceListEl);
                if (delta !== null) await animateScrollTo(sourceListEl, "top", delta, d(450));
            }
            if (cancelledRef.current) return;

            const sourceRect = cardEl.getBoundingClientRect();
            const sourceCenter = rectCenter(sourceRect);
            await animate(
                cursor,
                { x: sourceCenter.x, y: sourceCenter.y },
                { duration: s(550), ease: EASE },
            );
            if (cancelledRef.current) return;

            // Pick up: lift a ghost clone exactly over the real card.
            await animate(
                ghost,
                { x: sourceRect.left, y: sourceRect.top, opacity: 0, scale: 1, rotate: 0 },
                { duration: 0 },
            );
            setHolding(true);
            // Dim the real source card, same as a dnd-kit drag source (DraggableIssue) —
            // the ghost is standing in for it until `moveIssue` lands it for real.
            cardEl.style.opacity = "0.4";
            await Promise.all([
                animate(
                    ghost,
                    { opacity: 1, scale: 1.04, rotate: 2 },
                    { duration: s(220), ease: EASE },
                ),
                animate(cursor, { scale: 0.85 }, { duration: s(220) }),
            ]);
            await animate(cursor, { scale: 1 }, { duration: s(120) });
            if (cancelledRef.current) return;

            const targetColumnEl = locateColumn(currentFlight.targetStatus);
            if (!targetColumnEl) {
                setHolding(false);
                cardEl.style.opacity = ""; // bailing without moving it — undim the source
                await fadeAway(cursor, ghost);
                return;
            }
            if (rowEl) {
                const delta = horizontalScrollDelta(targetColumnEl, rowEl);
                if (delta !== null) await animateScrollTo(rowEl, "left", delta, d(450));
            }
            if (cancelledRef.current) return;

            const targetListEl = locateColumnList(targetColumnEl);
            const targetRect = (targetListEl ?? targetColumnEl).getBoundingClientRect();
            const dropPoint = { x: targetRect.left + 16, y: targetRect.top + 16 };

            await Promise.all([
                animate(
                    ghost,
                    { x: dropPoint.x, y: dropPoint.y },
                    { duration: s(650), ease: EASE },
                ),
                animate(
                    cursor,
                    { x: dropPoint.x, y: dropPoint.y },
                    { duration: s(650), ease: EASE },
                ),
            ]);
            if (cancelledRef.current) return;

            // Drop: commit the real (local-only) move, settle the ghost, flash the
            // destination, then fade both away — the real card appears in the target
            // column right as the ghost dissolves into it.
            setHolding(false);
            useKanbanBoardStore
                .getState()
                .moveIssue(currentFlight.issue.id, currentFlight.targetStatus);
            await animate(ghost, { rotate: 0, scale: 1 }, { duration: s(200), ease: EASE });

            if (targetListEl) {
                const r = targetListEl.getBoundingClientRect();
                highlight.style.left = `${r.left}px`;
                highlight.style.top = `${r.top}px`;
                highlight.style.width = `${r.width}px`;
                highlight.style.height = `${r.height}px`;
                animate(highlight, { opacity: [0, 0.5, 0] }, { duration: s(600), ease: EASE });
            }

            await Promise.all([
                animate(ghost, { opacity: 0, scale: 0.92 }, { duration: s(250) }),
                animate(cursor, { opacity: 0, scale: 0.6 }, { duration: s(250) }),
            ]);
        }

        run().finally(() => {
            if (!cancelledRef.current) finish();
        });

        return () => {
            cancelledRef.current = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flight]);

    if (!flight) return null;

    return (
        <div ref={scope} className="pointer-events-none fixed inset-0 z-[100]">
            <div ref={cursorRef} style={{ position: "fixed", left: 0, top: 0, opacity: 0 }}>
                {holding ? (
                    <LuGrab className="size-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
                ) : (
                    <LuMousePointer2 className="size-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
                )}
            </div>
            <div
                ref={ghostRef}
                style={{ position: "fixed", left: 0, top: 0, opacity: 0 }}
                className="w-72 shadow-2xl"
            >
                <TodoCard issue={flight.issue} />
            </div>
            <div
                ref={highlightRef}
                style={{ position: "fixed", left: 0, top: 0, opacity: 0 }}
                className="rounded-lg bg-matcha/10 ring-2 ring-matcha/70"
            />
        </div>
    );
}
