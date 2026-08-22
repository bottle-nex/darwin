import { displayNameOf, toneFor } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { BoardAssignee, BoardIssue, BoardResponse, ServerIssueStatus } from "@/types/board";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import {
    KanbanStatus,
    type Assignee,
    type BoardState,
    type Issue,
    type Priority,
} from "@/types/kanban";

/** Maps the real API's board payload onto the LLM Kanban's display shapes. */
export class KanbanMappers {
    static readonly NUMBER_TO_PRIORITY: Record<number, Priority> = {
        0: "none",
        1: "urgent",
        2: "high",
        3: "medium",
        4: "low",
    };

    // The server statuses that have a visible lane — derived straight from
    // KanbanStatus (itself a subset of the shared IssueStatus), so there's no
    // separate mapping table to keep in sync. Queued / Failed / Cancelled aren't in
    // this set and are skipped.
    private static readonly DISPLAYED_STATUSES = new Set<string>(Object.values(KanbanStatus));

    /** The lane for a server status, or null if it isn't one the board renders. */
    private static laneFor(status: ServerIssueStatus): KanbanStatus | null {
        return KanbanMappers.DISPLAYED_STATUSES.has(status) ? (status as KanbanStatus) : null;
    }

    static toAssignee(a: BoardAssignee): Assignee {
        return {
            id: a.id,
            name: displayNameOf(a.name, a.email),
            image: a.image,
            tone: toneFor(a.id),
        };
    }

    private static toLlmIssue(issue: BoardIssue, status: KanbanStatus, projectName: string): Issue {
        return {
            id: issue.id,
            boardIssue: issue,
            number: `#${issue.number}`,
            title: issue.title,
            project: projectName,
            tags: issue.tags,
            priority: KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium",
            assignees: issue.assignees.map(KanbanMappers.toAssignee),
            comments: 0,
            status,
            createdAt: issue.createdAt,
            targetDate: issue.targetDate,
        };
    }

    /**
     * Build the LLM board's status lanes from the server payload. Only issues NOT
     * parked in a custom column (`customColumnId === null`) belong here — they're
     * grouped by their status. Agent-only fields (queue position, runner, PR, …)
     * aren't in the board payload, so cards render without them for now.
     */
    static boardIssuesToLlmBoard(board: BoardResponse, projectName: string): BoardState {
        const lanes = KanbanBoard.emptyBoard();
        for (const issue of board.issues) {
            if (issue.customColumnId !== null) continue;
            const status = KanbanMappers.laneFor(issue.status);
            if (!status) continue;
            lanes[status].push(KanbanMappers.toLlmIssue(issue, status, projectName));
        }
        return lanes;
    }
}
