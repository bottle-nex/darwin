import type { LucideIcon } from "lucide-react";
import type { AvatarTone } from "@/components/playground/core/components/PlaygroundAvatar";

/**
 * Board columns map to matcha's agent flow: a team files an issue (To Do), an
 * agent claims and works it on a runner (In Progress), opens a PR for humans
 * (In Review), and it ships (Done). The enum value is the column id used by the
 * drag-and-drop layer and the per-status card switch.
 */
export enum KanbanStatus {
    Todo = "todo",
    InProgress = "in-progress",
    InReview = "in-review",
    Done = "done",
}

export type Priority = "urgent" | "high" | "normal" | "low";

/** A person on a card (filer / reviewer). Rendered as a letter avatar. */
export type Assignee = {
    id: string;
    name: string;
    tone: AvatarTone;
};

/** A coloured tag on an issue (feature, bug, chore…). `className` is dark-themed. */
export type IssueLabel = {
    name: string;
    className: string;
};

/** A pull request an agent opened from a runner. */
export type PullRequest = {
    number: string;
    added: number;
    removed: number;
};

/**
 * A board card. Common fields render on every card; the status-specific fields
 * are consumed by that status's card component (e.g. `step` on In Progress,
 * `pr` on In Review).
 */
export type Issue = {
    id: string;
    number: string;
    title: string;
    project: string;
    label?: IssueLabel;
    priority: Priority;
    /** Claude model assigned to the issue (e.g. "Opus 4.8"). */
    agent?: string;
    assignees: Assignee[];
    comments: number;
    status: KanbanStatus;

    // ── status-specific ──────────────────────────────────────────────
    /** To Do: position in the agent's pickup queue. */
    queuePosition?: number;
    /** In Progress: the agent's current step. */
    step?: string;
    /** In Progress: the runner executing the work. */
    runner?: string;
    /** In Review: the PR opened back to the repo. */
    pr?: PullRequest;
    /** Done: wall-clock time the agent took. */
    duration?: string;
    /** Done: human-readable resolution time. */
    resolvedAt?: string;
};

/** Static definition for a column header. `titleBox` is the only per-status colour. */
export type KanbanColumnDef = {
    status: KanbanStatus;
    title: string;
    icon: LucideIcon;
    /** Tailwind classes for the coloured box wrapping the column title. */
    titleBox: string;
};

/** The two ways to view the board's issues. */
export type KanbanView = "board" | "list";

/** Board state: each column's ordered issues, keyed by status. */
export type BoardState = Record<KanbanStatus, Issue[]>;
