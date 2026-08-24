"use client";

import { useMemo } from "react";

import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import type { BoardState } from "@/types/kanban";

export function useFilteredKanbanBoard(): BoardState {
    const project = useActiveProject();
    const feed = useBoardFeed(project?.id);
    const overlayActive = useKanbanBoardStore((state) => state.overlayActive);
    const overlayBoard = useKanbanBoardStore((state) => state.board);

    const board = useMemo(
        () =>
            KanbanMappers.boardIssuesToLlmBoard(
                { columns: [], issues: feed.rows },
                project?.name ?? "",
            ),
        [feed.rows, project?.name],
    );

    return overlayActive ? overlayBoard : board;
}
