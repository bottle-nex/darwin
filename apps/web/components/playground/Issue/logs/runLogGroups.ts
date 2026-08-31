import { type RunLogEvent, type RunLogEventKind } from "@trymatcha/types";

import { GROUP_LABEL } from "./runLog.registry";

const GROUPABLE_KINDS = new Set<RunLogEventKind>(Object.keys(GROUP_LABEL) as RunLogEventKind[]);

export type RunLogGroup = {
    key: string;
    kind: RunLogEventKind;
    events: RunLogEvent[];
};

export type RunLogRow =
    | { type: "single"; key: string; event: RunLogEvent }
    | { type: "header"; key: string; group: RunLogGroup; expanded: boolean }
    | { type: "child"; key: string; event: RunLogEvent };

export function groupRunLogEvents(events: readonly RunLogEvent[]): RunLogGroup[] {
    const groups: RunLogGroup[] = [];

    for (const event of events) {
        const open = groups[groups.length - 1];
        if (open && open.kind === event.kind && GROUPABLE_KINDS.has(event.kind)) {
            open.events.push(event);
            continue;
        }
        groups.push({ key: `run-log-${event.seq}`, kind: event.kind, events: [event] });
    }

    return groups;
}

export function toRunLogRows(
    groups: readonly RunLogGroup[],
    collapsed: ReadonlySet<string>,
): RunLogRow[] {
    const rows: RunLogRow[] = [];

    for (const group of groups) {
        if (group.events.length === 1) {
            rows.push({ type: "single", key: group.key, event: group.events[0]! });
            continue;
        }

        const expanded = !collapsed.has(group.key);
        rows.push({ type: "header", key: group.key, group, expanded });
        if (!expanded) continue;

        for (const event of group.events) {
            rows.push({ type: "child", key: `${group.key}-${event.seq}`, event });
        }
    }

    return rows;
}
