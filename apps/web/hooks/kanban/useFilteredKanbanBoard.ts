"use client";
import { useMemo } from "react";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useIssueFilter } from "@/hooks/kanban/useIssueFilter";
import type { BoardState } from "@/types/kanban";

/**
 * The LLM board with the active filters applied.
 *
 * `useKanbanBoardStore.board` is a mirror that `useKanbanPane` seeds from the
 * `useBoard` query in an effect — it also holds local-only edits (drag-and-drop
 * bridging, the flight-demo preview move) that don't come from the server at
 * all, so it can't just be replaced by a query-derived value. But that means
 * there's a render where the query has fresh data and the mirror hasn't caught
 * up yet (e.g. this pane just remounted after being unmounted for a while).
 * Rather than trust the mirror blindly, re-derive straight from the query
 * whenever its data has moved past what's been seeded — the mirror is only
 * used once it's actually caught up, which is also what preserves pending
 * local-only edits (they change `board` without changing `seededBoard`).
 */
export function useFilteredKanbanBoard(): BoardState {
    const activeProject = useActiveProject();
    const { data: serverBoard } = useBoard(activeProject?.id);
    const projectName = activeProject?.name ?? "";

    const seededBoard = useKanbanBoardStore((s) => s.seededBoard);
    const mirroredBoard = useKanbanBoardStore((s) => s.board);
    const matchesFilters = useIssueFilter();

    const board = useMemo(() => {
        if (!serverBoard || seededBoard === serverBoard) return mirroredBoard;
        return KanbanMappers.boardIssuesToLlmBoard(serverBoard, projectName);
    }, [serverBoard, seededBoard, mirroredBoard, projectName]);

    return useMemo(() => KanbanBoard.filterBoard(board, matchesFilters), [board, matchesFilters]);
}
