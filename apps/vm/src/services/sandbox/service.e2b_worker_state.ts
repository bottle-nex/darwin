export function requires_agent_run(agent_done_at: Date | null, resuming_push: boolean): boolean {
    return agent_done_at === null && !resuming_push;
}

export function previous_push_attempts(worker: { contextSummary: unknown }): number {
    const summary = worker.contextSummary as { pushAttempts?: unknown } | null;
    const attempts = Number(summary?.pushAttempts);
    return Number.isInteger(attempts) && attempts > 0 ? attempts : 0;
}

// The issue with an unpushed commit in this worker's retained sandbox — a retry must not reset the branch or re-run the agent, since the work only exists locally.
export function pending_push_issue_id(worker: { contextSummary: unknown }): string | undefined {
    if (previous_push_attempts(worker) === 0) return undefined;
    const summary = worker.contextSummary as { issueId?: unknown } | null;
    return typeof summary?.issueId === "string" ? summary.issueId : undefined;
}
