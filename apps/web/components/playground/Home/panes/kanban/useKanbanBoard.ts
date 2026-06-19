"use client";
import { useRef, useState } from "react";
import { getLabel, INITIAL_BOARD, STATUSES } from "./data";
import { KanbanStatus, type BoardState, type Issue } from "./types";
import type { CustomCard } from "./customkanban/types";

/** Everything `useKanbanBoard` exposes — the board plus the bridge intake. */
export type KanbanBoardApi = ReturnType<typeof useKanbanBoard>;

/**
 * Local LLM board state. The agent flow owns these columns; the only user edits
 * are the Custom Kanban bridge — a custom card filed into a column (`addIssue`)
 * or a bridge column's issue pulled out (`findIssue` + `removeIssue`). Which
 * columns bridge is configured by `BRIDGE_STATUSES` (see `data.ts`), not here.
 * Client-only for now (no issue API yet), so a refresh resets to `INITIAL_BOARD`.
 */
export function useKanbanBoard() {
    const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
    // Running issue number for cards filed from the Custom Kanban.
    const nextNumber = useRef(500);

    /** File a Custom Kanban card into the given column as a new issue. */
    function addIssue(status: KanbanStatus, card: CustomCard) {
        setBoard((prev) => {
            const column = prev[status];
            const issue: Issue = {
                id: `issue-custom-${card.id}`,
                number: `#${nextNumber.current++}`,
                title: card.title,
                project: "custom-kanban",
                label: card.label ? getLabel(card.label) : undefined,
                priority: card.priority,
                assignees: [],
                comments: 0,
                status,
                ...(status === KanbanStatus.Todo ? { queuePosition: column.length + 1 } : {}),
            };
            return { ...prev, [status]: [...column, issue] };
        });
    }

    /** Look up an issue by id across every column. */
    function findIssue(id: string): Issue | null {
        for (const status of STATUSES) {
            const issue = board[status].find((i) => i.id === id);
            if (issue) return issue;
        }
        return null;
    }

    /** Remove an issue (when dragged onto the Custom board) from its column. */
    function removeIssue(id: string) {
        setBoard(
            (prev) =>
                Object.fromEntries(
                    STATUSES.map((s) => [s, prev[s].filter((i) => i.id !== id)]),
                ) as BoardState,
        );
    }

    return { board, addIssue, findIssue, removeIssue };
}
