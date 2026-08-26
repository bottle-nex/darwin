import { create } from "zustand";

import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { type BoardState, type Issue, KanbanStatus } from "@/types/kanban";
import type { CustomCard } from "@/types/kanban-custom";

interface KanbanBoardState {
    board: BoardState;
    overlayActive: boolean;
    /** Running issue number for cards filed from the Custom Kanban. */
    nextNumber: number;
    beginOverlay: (board: BoardState) => void;
    clearOverlay: () => void;
    /** File a Custom Kanban card into the given column as a new issue. */
    addIssue: (status: KanbanStatus, card: CustomCard) => void;
    /** Remove an issue (when dragged onto the Custom board) from its column. */
    removeIssue: (id: string) => void;
    /**
     * Move an issue to a different status column, locally only — no persistence.
     * Used by the issue-flight animation to preview a status change the way a
     * future server-pushed trigger will apply it; the server owns saving it.
     */
    moveIssue: (id: string, toStatus: KanbanStatus) => void;
}

export const useKanbanBoardStore = create<KanbanBoardState>((set) => ({
    board: KanbanBoard.emptyBoard(),
    overlayActive: false,
    nextNumber: 500,

    beginOverlay: (board) => set({ board, overlayActive: true }),
    clearOverlay: () => set({ board: KanbanBoard.emptyBoard(), overlayActive: false }),

    addIssue: (status, card) =>
        set((s) => {
            const column = s.board[status];
            const issue: Issue = {
                id: `issue-custom-${card.id}`,
                number: `#${s.nextNumber}`,
                title: card.title,
                project: "custom-kanban",
                tags: card.tags,
                priority: card.priority,
                assignees: [],
                comments: 0,
                status,
                ...(status === KanbanStatus.Todo ? { queuePosition: column.length + 1 } : {}),
            };
            return {
                board: { ...s.board, [status]: [...column, issue] },
                nextNumber: s.nextNumber + 1,
            };
        }),

    removeIssue: (id) =>
        set((s) => ({
            board: Object.fromEntries(
                KanbanBoard.STATUSES.map((status) => [
                    status,
                    s.board[status].filter((i) => i.id !== id),
                ]),
            ) as BoardState,
        })),

    moveIssue: (id, toStatus) =>
        set((s) => {
            const fromStatus = KanbanBoard.STATUSES.find((status) =>
                s.board[status].some((i) => i.id === id),
            );
            if (!fromStatus) return s;
            const issue = s.board[fromStatus].find((i) => i.id === id)!;
            return {
                board: {
                    ...s.board,
                    [fromStatus]: s.board[fromStatus].filter((i) => i.id !== id),
                    [toStatus]: [{ ...issue, status: toStatus }, ...s.board[toStatus]],
                },
            };
        }),
}));

/** Look up an issue by id across every column. */
export function findIssueInBoard(board: BoardState, id: string): Issue | null {
    for (const status of KanbanBoard.STATUSES) {
        const issue = board[status].find((i) => i.id === id);
        if (issue) return issue;
    }
    return null;
}
