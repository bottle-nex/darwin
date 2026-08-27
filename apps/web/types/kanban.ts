import { IssueStatus } from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";

import type { AvatarTone } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { BoardIssue, BoardTag } from "@/types/board";

export const KanbanStatus = {
    Todo: IssueStatus.Todo,
    Queued: IssueStatus.Queued,
    InProgress: IssueStatus.InProgress,
    InReview: IssueStatus.InReview,
    Done: IssueStatus.Done,
    Failed: IssueStatus.Failed,
    Cancelled: IssueStatus.Cancelled,
} as const;
export type KanbanStatus = (typeof KanbanStatus)[keyof typeof KanbanStatus];

export type Priority = "none" | "urgent" | "high" | "medium" | "low";

export type Assignee = {
    id: string;
    name: string;
    image?: string | null;
    tone: AvatarTone;
};

export type PullRequest = {
    number: string;
    added: number;
    removed: number;
};

export type Issue = {
    id: string;
    boardIssue?: BoardIssue;
    number: string;
    title: string;
    project: string;
    tags: BoardTag[];
    priority: Priority;
    /** Claude model assigned to the issue (e.g. "Opus 4.8"). */
    agent?: string;
    assignees: Assignee[];
    comments: number;
    status: KanbanStatus;
    createdAt?: string;
    targetDate?: string | null;

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
    /** Done / Cancelled: human-readable resolution time. */
    resolvedAt?: string;
    /** Failed: short reason the run errored out. */
    error?: string;
};

/** Static definition for a column header. `titleBox`/`cardTint` are the per-status colours. */
export type KanbanColumnDef = {
    status: KanbanStatus;
    title: string;
    icon: IconType;
    /** Tailwind classes for the coloured box wrapping the column title. */
    titleBox: string;
};

/** The two ways to view the board's issues. */
export type KanbanView = "board" | "list";

/** Board state: each column's ordered issues, keyed by status. */
export type BoardState = Record<KanbanStatus, Issue[]>;
