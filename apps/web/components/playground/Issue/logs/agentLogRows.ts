import { type RunLogEvent, RunLogEventKind } from "@trymatcha/types";

export type AgentLogRow = {
    key: string;
    event: RunLogEvent;
    count: number;
};

const REPEATABLE_KINDS = new Set<RunLogEventKind>([
    RunLogEventKind.FileRead,
    RunLogEventKind.FileWrite,
    RunLogEventKind.Search,
]);

/**
 * One failure, reported from both sides, is one failure.
 *
 * The worker watches the harness run `git add … && git commit -m …` and the agent reports the
 * same break as `git commit`, so the two arrive back to back naming the same thing at different
 * lengths. The shorter one is the one a person can read.
 */
function duplicateFailure(event: RunLogEvent, next: RunLogEvent | undefined): boolean {
    return (
        event.kind === RunLogEventKind.CommandFailed &&
        next?.kind === RunLogEventKind.CommandFailed &&
        (event.command.includes(next.command) || next.command.includes(event.command)) &&
        event.command.length >= next.command.length
    );
}

/**
 * One row per line on screen, with runs of the same action counted rather than listed.
 *
 * A count is the whole row, not a fold over hidden ones: nothing here can be opened, so a long
 * run stays short without putting anything out of reach that the row does not already say.
 */
export function toAgentLogRows(events: readonly RunLogEvent[]): AgentLogRow[] {
    const rows: AgentLogRow[] = [];

    for (const [index, event] of events.entries()) {
        if (duplicateFailure(event, events[index + 1])) continue;

        const open = rows[rows.length - 1];
        if (open && open.event.kind === event.kind && REPEATABLE_KINDS.has(event.kind)) {
            open.count += 1;
            continue;
        }
        rows.push({ key: `run-log-${event.seq}`, event, count: 1 });
    }

    return rows;
}
