import { create } from "zustand";

import { buildMockIssues } from "@/data/dummy-gantt-issues";
import { GanttTimeline } from "@/lib/gantt/GanttTimeline";
import type { GanttIssue } from "@/types/gantt";

interface GanttBoardState {
    selectedDate: Date;
    nowMinute: number;
    issues: GanttIssue[];
    setSelectedDate: (date: Date) => void;
    setNowMinute: (minute: number) => void;
    stepDay: (delta: number) => void;
}

const initialNowMinute = GanttTimeline.nowMinuteOfDay();

/**
 * The Gantt's board state: the viewed day, the live minute-of-day clock, and the
 * issue bars. Mock-backed for now (a fresh page load resets to `buildMockIssues`)
 * — there's no issue/timeline API yet. `GanttBoard` drives the clock tick and
 * owns scroll/DOM — a `setInterval` can't live in the store itself, since a
 * store is created once at module load with no mount/unmount to tie the
 * interval's lifecycle to.
 *
 * A worker pauses on its own when it's blocked (e.g. waiting on user input),
 * which freezes that issue's bar — this is system state, never user-triggered.
 */
export const useGanttBoardStore = create<GanttBoardState>((set) => ({
    selectedDate: new Date(),
    nowMinute: initialNowMinute,
    issues: buildMockIssues(Math.floor(initialNowMinute)),

    setSelectedDate: (selectedDate) => set({ selectedDate }),
    setNowMinute: (nowMinute) => set({ nowMinute }),
    stepDay: (delta) =>
        set((s) => {
            const next = new Date(s.selectedDate);
            next.setDate(next.getDate() + delta);
            return { selectedDate: next };
        }),
}));
