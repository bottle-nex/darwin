"use client";

import { useEffect, useRef } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import GanttRuler from "./GanttRuler";
import GanttGrid from "./GanttGrid";
import GanttSidebar from "./GanttSidebar";
import GanttNowLine from "./GanttNowLine";
import GanttIssueCard from "./GanttIssueCard";
import { useGanttBoard } from "@/store/gantt/useGanttBoard";
import { DAY_WIDTH, MINUTE_WIDTH, WORKER_LANES, toDateKey } from "./types";

/**
 * The per-project Gantt: a read-only live preview of the project's three workers
 * solving issues in parallel. Fills the Projects-surface pane; `useGanttBoard`
 * holds state, this component owns layout and scroll-to-now. The `dark` class
 * resolves the theme tokens to dark so it sits in the playground.
 */
export default function GanttBoard() {
    const { selectedDate, setSelectedDate, isToday, nowMinute, issues, stepDay } = useGanttBoard();
    const trackRef = useRef<HTMLDivElement>(null);

    const pausedWorkerIds = new Set(
        issues.filter((issue) => issue.pausedAt != null).map((issue) => issue.workerId),
    );

    // Centre the scroll near "now"; past days have no live marker, so default to 09:00.
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const target = isToday ? nowMinute * MINUTE_WIDTH : 9 * 60 * MINUTE_WIDTH;
        el.scrollTo({ left: Math.max(0, target - el.clientWidth * 0.6) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isToday, toDateKey(selectedDate)]);

    return (
        <div className="dark flex h-full min-h-0 w-full flex-col bg-background text-foreground">
            <header className="flex shrink-0 items-center justify-end border-b border-border px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => stepDay(-1)}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Previous day"
                    >
                        <MdKeyboardArrowLeft className="size-4" aria-hidden />
                    </button>
                    <input
                        type="date"
                        value={toDateKey(selectedDate)}
                        onChange={(e) => {
                            const [y, m, d] = e.target.value.split("-").map(Number);
                            if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
                        }}
                        className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring [&::-webkit-calendar-picker-indicator]:invert"
                    />
                    <button
                        onClick={() => stepDay(1)}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Next day"
                    >
                        <MdKeyboardArrowRight className="size-4" aria-hidden />
                    </button>
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <GanttSidebar pausedWorkerIds={pausedWorkerIds} />
                <div ref={trackRef} className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="relative flex h-full flex-col" style={{ width: DAY_WIDTH }}>
                        <GanttGrid />
                        <GanttRuler />

                        <div className="relative flex flex-1 flex-col">
                            {WORKER_LANES.map((lane) => (
                                <div
                                    key={lane.id}
                                    className="relative flex-1 border-b border-border last:border-b-0"
                                >
                                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/40" />
                                    {issues
                                        .filter((issue) => issue.workerId === lane.id)
                                        .map((issue) => (
                                            <GanttIssueCard
                                                key={issue.id}
                                                issue={issue}
                                                now={nowMinute}
                                            />
                                        ))}
                                </div>
                            ))}
                        </div>

                        {isToday && <GanttNowLine minute={nowMinute} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
