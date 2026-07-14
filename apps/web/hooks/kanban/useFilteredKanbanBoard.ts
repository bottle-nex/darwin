"use client";
import { useMemo } from "react";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardState } from "@/types/kanban";

/** The LLM board with the active search + tag filters applied. */
export function useFilteredKanbanBoard(): BoardState {
    const board = useKanbanBoardStore((s) => s.board);
    const search = useKanbanOptionsStore((s) => s.search);
    const selectedTagIds = useKanbanOptionsStore((s) => s.selectedTagIds);

    return useMemo(
        () => KanbanBoard.filterBoard(board, search, selectedTagIds),
        [board, search, selectedTagIds],
    );
}
