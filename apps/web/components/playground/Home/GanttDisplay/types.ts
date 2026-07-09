// Per-project Gantt model. X = time (one day, minute-of-day, 0–1440); Y = the 3
// worker lanes. A bar is one issue a worker picked up off its queue.

/** A fixed worker lane. A project always has exactly three. */
export interface WorkerLane {
    id: string;
    /** Display label, e.g. "Worker 1". */
    name: string;
    /** Lane accent colour — tuned to read on both light and dark themes. */
    color: string;
}

/** The three fixed lanes every project's Gantt renders. */
export const WORKER_LANES: WorkerLane[] = [
    { id: "worker1", name: "Worker 1", color: "#AB9FF2" }, // primary lavender
    { id: "worker2", name: "Worker 2", color: "#5EC8B7" }, // teal
    { id: "worker3", name: "Worker 3", color: "#E0A26B" }, // amber
];

// ── Layout constants (px) ────────────────────────────────────────────────────

/** Minutes in a day — the full span of the time axis. */
export const DAY_MINUTES = 1440;

/** Pixels per minute on the axis. Sized so minute-scale issues stay legible. */
export const MINUTE_WIDTH = 16;

/** Full scrollable width of one day. */
export const DAY_WIDTH = DAY_MINUTES * MINUTE_WIDTH;

/** Height of the hour ruler row. */
export const RULER_HEIGHT = 44;

/** Width of the fixed left sidebar holding lane labels. */
export const SIDEBAR_WIDTH = 120;

/** Current minute-of-day (fractional), e.g. 12:30 → 750.0. */
export function nowMinuteOfDay(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

// ── Issues (bars) ─────────────────────────────────────────────────────────────

export type IssueStatus = "queued" | "solving" | "done";
export type Priority = "urgent" | "high" | "normal" | "low";

/**
 * One issue a worker has on its timeline.
 *   • start       — minute-of-day the bar begins (pickup time, or projected slot
 *                   for a queued issue).
 *   • durationEst — estimated solve time, in minutes (the bar's base width).
 *   • endedAt     — minute-of-day the worker finished (set only when done).
 */
export interface GanttIssue {
    id: string;
    workerId: string;
    number: string;
    title: string;
    /** One-line summary shown under the title on the card. */
    description: string;
    /** Display name of the user who filed the issue (schema: Issue.creator). */
    createdBy: string;
    status: IssueStatus;
    priority: Priority;
    start: number;
    durationEst: number;
    endedAt?: number;
    /** Set while a solving issue is paused — the minute its bar froze. */
    pausedAt?: number;
    /** Why it's paused, e.g. "waiting for user input". */
    pauseReason?: string;
    /** Short tag shown as a chip, e.g. "bug", "feature". */
    label?: string;
    /** Claude model working the issue, e.g. "Opus 4.8". */
    agent?: string;
    comments?: number;
}

/** Tailwind dark-mode priority dot colours (mirrors the home-page kanban cards). */
export const PRIORITY_DOT: Record<Priority, string> = {
    urgent: "bg-neutral-100",
    high: "bg-neutral-400",
    normal: "bg-neutral-600",
    low: "bg-neutral-700",
};

/** Left offset (px) and width (px) of an issue's bar. `now` drives live growth. */
export function barGeometry(issue: GanttIssue, now: number): { left: number; width: number } {
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
        left: issue.start * MINUTE_WIDTH,
        width: Math.max(MINUTE_WIDTH, (end - issue.start) * MINUTE_WIDTH),
    };
}

/** Minute-of-day → "HH:MM". */
export function fmtClock(minute: number): string {
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
export function issueMeta(issue: GanttIssue, now: number): string {
    if (issue.status === "done") {
        const end = issue.endedAt ?? issue.start + issue.durationEst;
        return `${fmtClock(issue.start)}–${fmtClock(end)} · ${Math.round(end - issue.start)}m`;
    }
    if (issue.status === "solving") {
        const end = issue.pausedAt ?? now;
        const elapsed = Math.max(0, Math.round(end - issue.start));
        return `${fmtClock(issue.start)} · ${elapsed}m / ${issue.durationEst}m`;
    }
    return `~${fmtClock(issue.start)} · est ${issue.durationEst}m`;
}

/** Local YYYY-MM-DD for a date (used by the date picker + "is today" check). */
export function toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
