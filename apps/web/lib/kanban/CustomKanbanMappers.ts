import type { BoardIssue, BoardResponse } from "@/types/board";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import type { CustomCard, CustomColumn } from "@/types/kanban-custom";

/** Maps the real API's board payload onto the Custom Kanban's display shapes. */
export class CustomKanbanMappers {
    /** Convert a raw server issue row into the card the Custom Kanban renders. */
    static boardIssueToCard(issue: BoardIssue): CustomCard {
        return {
            id: issue.id,
            boardIssue: issue,
            number: issue.number,
            title: issue.title,
            tags: issue.tags,
            priority: KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium",
            assignees: issue.assignees.map(KanbanMappers.toAssignee),
            status: issue.status,
            createdAt: issue.createdAt,
            targetDate: issue.targetDate,
        };
    }

    /**
     * Build the Custom Kanban's columns from a board payload: columns left-to-right
     * in the order the server returns them (the requesting user's personal order,
     * falling back to the project's default `order` for columns they haven't
     * pinned — see `controller.get_issues.ts`), each holding the issues parked in
     * it (issues whose `customColumnId` matches). Issues arrive createdAt-ascending,
     * so card order is insertion order.
     */
    static boardToColumns(board: BoardResponse): CustomColumn[] {
        return board.columns.map((col) => ({
            id: col.id,
            title: col.label,
            cards: board.issues
                .filter((issue) => issue.customColumnId === col.id)
                .map(CustomKanbanMappers.boardIssueToCard),
        }));
    }
}
