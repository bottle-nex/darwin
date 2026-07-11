import type { GanttIssue, WorkerLane } from "@/types/gantt";

/** Layout constants and time-math helpers for the Gantt board. */
export class GanttTimeline {
    /** The three fixed lanes every project's Gantt renders. */
    static readonly WORKER_LANES: WorkerLane[] = [
        { id: "worker1", name: "Worker 1", color: "#AB9FF2" }, // primary lavender
        { id: "worker2", name: "Worker 2", color: "#5EC8B7" }, // teal
        { id: "worker3", name: "Worker 3", color: "#E0A26B" }, // amber
    ];

    // ── Layout constants (px) ────────────────────────────────────────────────

    /** Minutes in a day — the full span of the time axis. */
    static readonly DAY_MINUTES = 1440;

    /** Pixels per minute on the axis. Sized so minute-scale issues stay legible. */
    static readonly MINUTE_WIDTH = 16;

    /** Full scrollable width of one day. */
    static readonly DAY_WIDTH = GanttTimeline.DAY_MINUTES * GanttTimeline.MINUTE_WIDTH;

    /** Height of the hour ruler row. */
    static readonly RULER_HEIGHT = 44;

    /** Width of the fixed left sidebar holding lane labels. */
    static readonly SIDEBAR_WIDTH = 120;

    /** Tailwind dark-mode priority dot colours (mirrors the home-page kanban cards). */
    static readonly PRIORITY_DOT: Record<string, string> = {
        urgent: "bg-neutral-100",
        high: "bg-neutral-400",
        normal: "bg-neutral-600",
        low: "bg-neutral-700",
    };

    /** Current minute-of-day (fractional), e.g. 12:30 → 750.0. */
    static nowMinuteOfDay(): number {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    }

    /** Left offset (px) and width (px) of an issue's bar. `now` drives live growth. */
    static barGeometry(issue: GanttIssue, now: number): { left: number; width: number } {
        let end: number;
        if (issue.status === "done") {
            end = issue.endedAt ?? issue.start + issue.durationEst;
        } else if (issue.status === "solving") {
            // Paused: the bar freezes at the pause moment. Otherwise it grows live,
            // overrunning its estimate until it catches up to "now".
            end = issue.pausedAt ?? Math.max(issue.start + issue.durationEst, now);
        } else {
            end = issue.start + issue.durationEst;
        }
        return {
            left: issue.start * GanttTimeline.MINUTE_WIDTH,
            width: Math.max(
                GanttTimeline.MINUTE_WIDTH,
                (end - issue.start) * GanttTimeline.MINUTE_WIDTH,
            ),
        };
    }

    /** Minute-of-day → "HH:MM". */
    static fmtClock(minute: number): string {
        const total = Math.max(0, Math.floor(minute));
        const h = String(Math.floor(total / 60) % 24).padStart(2, "0");
        const m = String(total % 60).padStart(2, "0");
        return `${h}:${m}`;
    }

    /**
     * Compact "when + how long" line for a card's meta row, keyed to status:
     *   • done    — "09:12–09:47 · 35m"   (actual span + duration)
     *   • solving — "09:12 · 12m / 40m"   (start + live elapsed / estimate)
     *   • queued  — "~10:30 · est 30m"    (projected start + estimate)
     */
    static issueMeta(issue: GanttIssue, now: number): string {
        if (issue.status === "done") {
            const end = issue.endedAt ?? issue.start + issue.durationEst;
            return `${GanttTimeline.fmtClock(issue.start)}–${GanttTimeline.fmtClock(end)} · ${Math.round(end - issue.start)}m`;
        }
        if (issue.status === "solving") {
            const end = issue.pausedAt ?? now;
            const elapsed = Math.max(0, Math.round(end - issue.start));
            return `${GanttTimeline.fmtClock(issue.start)} · ${elapsed}m / ${issue.durationEst}m`;
        }
        return `~${GanttTimeline.fmtClock(issue.start)} · est ${issue.durationEst}m`;
    }

    /** Local YYYY-MM-DD for a date (used by the date picker + "is today" check). */
    static toDateKey(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
}
