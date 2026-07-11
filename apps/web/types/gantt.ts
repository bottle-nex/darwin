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

export type GanttIssueStatus = "queued" | "solving" | "done";
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
    status: GanttIssueStatus;
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
