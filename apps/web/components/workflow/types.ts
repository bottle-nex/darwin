// ── Domain model ────────────────────────────────────────────────────────────
// A node is one issue assigned to a worker. Workers run in parallel; within a
// worker, nodes run sequentially (by `sequence`). 1 tick = 1 minute.

export interface ResponsePeriod {
    id: string;
    label: string; // e.g. "Clarification", "Suggestion"
    startOffset: number; // ticks from node.startAbs
    endOffset: number;
    color: string;
}

export interface IssueNode {
    id: string;
    workerId: string;
    sequence: number;
    issueName: string;
    description: string;
    issuer: string; // user id who raised the issue
    engineer: string; // user id of the engineer involved
    estimatedMinutes: number; // estimated time to resolve, in ticks (minutes)
    startedAt?: number; // minute-of-day the node actually started
    endedAt?: number; // minute-of-day the node actually ended
    responsePeriods?: ResponsePeriod[]; // engineer response windows within this node
}

export type NodeStatus = "done" | "running" | "pending";

export interface PositionedNode extends IssueNode {
    startAbs: number; // absolute minute-of-day where the node begins
    endAbs: number; // absolute minute-of-day where the node ends
    status: NodeStatus;
}

export interface WorkerDef {
    id: string;
    name: string;
    color: string;
}

// ── Layout engine ───────────────────────────────────────────────────────────
// Every worker's first node begins at `startMinute` (the timeline's start).
// Each subsequent node begins DISPATCH_GAP ticks after the previous one ended.
// Nodes acquire their own `startedAt` once the server confirms the container started.
//
// A node's length comes from:
//   • done    → endedAt − startedAt (actual, may exceed the estimate)
//   • running → max(startedAt + estimate, now) — grows live past the estimate
//   • pending → estimate (predicted; overruns upstream push it to the right)
//
// The timeline ends at the latest node end across all workers.

export function computeLayout(
    nodes: IssueNode[],
    startMinute: number,
    nowMinute: number,
): { positioned: PositionedNode[]; endMinute: number } {
    const byWorker = new Map<string, IssueNode[]>();
    for (const node of nodes) {
        const list = byWorker.get(node.workerId) ?? [];
        list.push(node);
        byWorker.set(node.workerId, list);
    }

    const positioned: PositionedNode[] = [];
    let endMinute = startMinute;

    for (const list of byWorker.values()) {
        list.sort((a, b) => a.sequence - b.sequence);
        let cursor = startMinute; // where the next node would begin

        for (const node of list) {
            const startAbs = node.startedAt ?? cursor;

            let endAbs: number;
            let status: NodeStatus;
            if (node.endedAt != null) {
                endAbs = node.endedAt;
                status = "done";
            } else if (node.startedAt != null) {
                endAbs = Math.max(node.startedAt + node.estimatedMinutes, nowMinute);
                status = "running";
            } else {
                endAbs = startAbs + node.estimatedMinutes;
                status = "pending";
            }

            positioned.push({ ...node, startAbs, endAbs, status });
            cursor = endAbs + 2;
            if (endAbs > endMinute) endMinute = endAbs;
        }
    }

    return { positioned, endMinute };
}

export function fmtDuration(minutes: number): string {
    const m = Math.max(1, Math.round(minutes));
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
}
