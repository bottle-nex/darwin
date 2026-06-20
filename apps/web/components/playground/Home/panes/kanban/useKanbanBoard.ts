"use client";
import { useRef, useState } from "react";
import { getLabel, INITIAL_BOARD, STATUSES } from "./data";
import { boardIssuesToLlmBoard } from "./mappers";
import { KanbanStatus, type BoardState, type Issue } from "./types";
import type { BoardResponse } from "@/types/board";
import type { CustomCard } from "./customkanban/types";

/** Everything `useKanbanBoard` exposes — the board plus the bridge intake. */
export type KanbanBoardApi = ReturnType<typeof useKanbanBoard>;

type UseKanbanBoardArgs = {
    /** The hydrated board from the server; seeds the status lanes once it loads. */
    board: BoardResponse | undefined;
    /** Project name shown on each LLM card. */
    projectName: string;
};

/**
 * LLM board state, seeded from the server. The status lanes hold issues that
 * aren't parked in a custom column (`customColumnId === null`), grouped by
 * status. The only local edits are the Custom Kanban bridge — a custom card
 * filed into a lane (`addIssue`) or a bridge issue pulled out (`findIssue` +
 * `removeIssue`); those persist via the custom hook and re-seed on refetch.
 */
export function useKanbanBoard({ board: serverBoard, projectName }: UseKanbanBoardArgs) {
    const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
    const [seededBoard, setSeededBoard] = useState<BoardResponse | undefined>(undefined);
    // Running issue number for cards filed from the Custom Kanban.
    const nextNumber = useRef(500);

    // Seed (and re-seed) the lanes from the server whenever fresh data arrives —
    // render-time, mirroring the custom board (see useCustomKanban for the rationale).
    if (serverBoard && serverBoard !== seededBoard) {
        setSeededBoard(serverBoard);
        setBoard(boardIssuesToLlmBoard(serverBoard, projectName));
    }

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
