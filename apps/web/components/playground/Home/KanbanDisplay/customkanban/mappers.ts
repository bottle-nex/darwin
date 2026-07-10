import type { BoardIssue, BoardResponse } from "@/types/board";
import { NUMBER_TO_PRIORITY, toAssignee } from "../mappers";
import type { CustomCard, CustomColumn } from "./types";

/**
 * Descriptions are stored as rich-text editor HTML; card previews are plain text.
 * Entities are left encoded — a preview is a glance, not a rendering.
 */
export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Convert a raw server issue row into the card the Custom Kanban renders. */
export function boardIssueToCard(issue: BoardIssue): CustomCard {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.description || undefined,
        tags: issue.tags,
        priority: NUMBER_TO_PRIORITY[issue.priority] ?? "normal",
        assignees: issue.assignees.map(toAssignee),
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
