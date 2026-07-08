import type { BoardIssue, BoardResponse } from "@/types/board";
import type { Priority } from "../types";
import type { CustomCard, CustomColumn } from "./types";

/** Backend numeric priority (1=Urgent…4=Low) → the frontend's label scale. */
const NUMBER_TO_PRIORITY: Record<number, Priority> = {
    1: "urgent",
    2: "high",
    3: "normal",
    4: "low",
};

/** Convert a raw server issue row into the card the Custom Kanban renders. */
export function boardIssueToCard(issue: BoardIssue): CustomCard {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.description || undefined,
        label: issue.label ?? undefined,
        priority: NUMBER_TO_PRIORITY[issue.priority] ?? "normal",
        assignees: issue.assignees,
    };
}

/**
 * Build the Custom Kanban's columns from a board payload: columns left-to-right
 * by `order`, each holding the issues parked in it (issues whose `customColumnId`
 * matches). Issues arrive createdAt-ascending, so card order is insertion order.
 */
export function boardToColumns(board: BoardResponse): CustomColumn[] {
    return [...board.columns]
        .sort((a, b) => a.order - b.order)
        .map((col) => ({
            id: col.id,
            title: col.label,
            cards: board.issues
                .filter((issue) => issue.customColumnId === col.id)
                .map(boardIssueToCard),
        }));
}
