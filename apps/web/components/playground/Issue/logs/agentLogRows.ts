import { type RunLogEvent, RunLogEventKind } from "@trydarwin/types";

/**
 * One command, reported from both sides, is one row.
 *
 * The worker watches the harness run a command and the agent reports the same one afterwards
 * with a title. The writer already collapses the pair when the two spell the command
 * identically; this catches the case where they do not — the agent sends `git commit` for what
 * the trace saw as `git add … && git commit -m …`. The titled one is the one worth keeping.
 */
function supersededBy(event: RunLogEvent, next: RunLogEvent | undefined): boolean {
    if (event.kind !== RunLogEventKind.Command || next?.kind !== RunLogEventKind.Command) {
        return false;
    }
    const related = event.command.includes(next.command) || next.command.includes(event.command);
    return related && !event.title && Boolean(next.title);
}

const KNOWN_KINDS = new Set<string>(Object.values(RunLogEventKind));

/**
 * A run stored before the vocabulary last changed still holds kinds nothing renders any more.
 * They are dropped here rather than guarded at every lookup, so the rest of the log can take a
 * known kind for granted instead of every map needing a fallback.
 */
function renderable(event: RunLogEvent): boolean {
    return KNOWN_KINDS.has(event.kind);
}

export function toAgentLogRows(events: readonly RunLogEvent[]): RunLogEvent[] {
    return events.filter(
        (event, index) => renderable(event) && !supersededBy(event, events[index + 1]),
    );
}
