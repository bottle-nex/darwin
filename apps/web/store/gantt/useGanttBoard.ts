"use client";
import { useCallback, useEffect, useState } from "react";
import { buildMockIssues } from "@/data/dummy-gantt-issues";
import { GanttTimeline } from "@/lib/gantt/GanttTimeline";
import type { GanttIssue } from "@/types/gantt";

/** Everything `useGanttBoard` exposes — the props the Gantt page consumes. */
export type GanttBoardApi = ReturnType<typeof useGanttBoard>;

/**
 * Owns the Gantt's board state: the viewed day, the live minute-of-day clock,
 * and the issue bars. Mock-backed for now (a refresh resets to `buildMockIssues`)
 * — there's no issue/timeline API yet. The view layer handles scroll/DOM.
 *
 * A worker pauses on its own when it's blocked (e.g. waiting on user input),
 * which freezes that issue's bar — this is system state, never user-triggered.
 */
export function useGanttBoard() {
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [nowMinute, setNowMinute] = useState<number>(GanttTimeline.nowMinuteOfDay);
    const [issues] = useState<GanttIssue[]>(() =>
        buildMockIssues(Math.floor(GanttTimeline.nowMinuteOfDay())),
    );

    const isToday = GanttTimeline.toDateKey(selectedDate) === GanttTimeline.toDateKey(new Date());

    useEffect(() => {
        const id = setInterval(() => setNowMinute(GanttTimeline.nowMinuteOfDay()), 1000);
        return () => clearInterval(id);
    }, []);

    const stepDay = useCallback((delta: number) => {
        setSelectedDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + delta);
            return next;
        });
    }, []);

    return { selectedDate, setSelectedDate, isToday, nowMinute, issues, stepDay };
}
