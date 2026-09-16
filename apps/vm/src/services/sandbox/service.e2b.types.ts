import type Logger from "@trydarwin/logger";
import type { RunLogEventKind, RunLogMilestoneBody } from "@trydarwin/types";
import type { Sandbox } from "e2b";

export interface SolveContext {
    sandbox: Sandbox;
    log: Logger;
    workerId: string;
    projectId: string;
    planMd: string | null;
    repoFullName: string;
    repoOwner: string;
    baseBranch: string;
    ghToken: string;
    secrets: () => string[];
    pushRetryIssueId: string | undefined;
}

export type ChangesSummary = Extract<
    RunLogMilestoneBody,
    { kind: typeof RunLogEventKind.ChangesSummary }
>;
export type Committed = Extract<RunLogMilestoneBody, { kind: typeof RunLogEventKind.Committed }>;

export class IssueBranchPushError extends Error {}
