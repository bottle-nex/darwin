import { displayNameOf, toneFor } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { BoardAssignee, BoardIssue, BoardResponse, ServerIssueStatus } from "@/types/board";
import { emptyBoard } from "./data";
import { KanbanStatus, type Assignee, type BoardState, type Issue, type Priority } from "./types";

export const NUMBER_TO_PRIORITY: Record<number, Priority> = {
    1: "urgent",
    2: "high",
    3: "normal",
    4: "low",
};

// The server statuses that have a visible lane — derived straight from
// KanbanStatus (itself a subset of the shared IssueStatus), so there's no
// separate mapping table to keep in sync. Queued / Failed / Cancelled aren't in
// this set and are skipped.
const DISPLAYED_STATUSES = new Set<string>(Object.values(KanbanStatus));

/** The lane for a server status, or null if it isn't one the board renders. */
function laneFor(status: ServerIssueStatus): KanbanStatus | null {
    return DISPLAYED_STATUSES.has(status) ? (status as KanbanStatus) : null;
}

export function toAssignee(a: BoardAssignee): Assignee {
    return {
        id: a.id,
        name: displayNameOf(a.name, a.email),
        image: a.image,
        tone: toneFor(a.id),
    };
}

function toLlmIssue(issue: BoardIssue, status: KanbanStatus, projectName: string): Issue {
    return {
        id: issue.id,
        number: `#${issue.number}`,
        title: issue.title,
        project: projectName,
        tags: issue.tags,
        priority: NUMBER_TO_PRIORITY[issue.priority] ?? "normal",
        assignees: issue.assignees.map(toAssignee),
        comments: 0,
        status,
    };
}

/**
 * Build the LLM board's status lanes from the server payload. Only issues NOT
 * parked in a custom column (`customColumnId === null`) belong here — they're
 * grouped by their status. Agent-only fields (queue position, runner, PR, …)
 * aren't in the board payload, so cards render without them for now.
 */
export function boardIssuesToLlmBoard(board: BoardResponse, projectName: string): BoardState {
    const lanes = emptyBoard();
    for (const issue of board.issues) {
        if (issue.customColumnId !== null) continue;
        const status = laneFor(issue.status);
        if (!status) continue;
        lanes[status].push(toLlmIssue(issue, status, projectName));
    }
    return lanes;
}
