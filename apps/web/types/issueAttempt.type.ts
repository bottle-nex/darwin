import type { AgentSessionStatus } from "@trymatcha/types";

export interface IssueAttemptReopen {
    note: string;
    actorName: string | null;
    at: string;
}

export interface IssueAttempt {
    id: string;
    attemptNumber: number;
    status: AgentSessionStatus;
    model: string | null;
    report: string | null;
    error: string | null;
    commits: number | null;
    filesChanged: number | null;
    startedAt: string;
    endedAt: string | null;
    reopenedBy: IssueAttemptReopen | null;
}

export interface IssuePullRequest {
    number: number;
    url: string | null;
    title: string | null;
    merged: boolean;
}

export interface IssueAttempts {
    pullRequest: IssuePullRequest | null;
    attempts: IssueAttempt[];
}
