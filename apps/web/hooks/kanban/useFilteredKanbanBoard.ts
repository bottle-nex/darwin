"use client";

import { useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardFeed } from "@/hooks/issues/useBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import type { BoardState } from "@/types/kanban";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";

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
