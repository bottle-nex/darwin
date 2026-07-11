"use client";
import { useEffect, useMemo, useState } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardView, KanbanView } from "@/types/kanban";
import { useKanbanBoard } from "./useKanbanBoard";
import { useKanbanOptions } from "./useKanbanOptions";
import { useCustomKanban } from "./useCustomKanban";

/**
 * All the data, board hooks, and view state the Kanban pane needs — kept out of
 * the component so `KanbanDisplay` stays a thin layout. Resolves the active
 * project from the URL, wires the two boards together (a custom card can be filed
 * onto the LLM board and back), and exposes the filtered board plus the toolbar's
 * view toggles.
 */
export function useKanbanPane() {
    const activeProject = useActiveProject();

    const { data: board } = useBoard(activeProject?.id);
    const kanban = useKanbanBoard({ board, projectName: activeProject?.name ?? "" });
    const options = useKanbanOptions();
    const custom = useCustomKanban({
        projectId: activeProject?.id,
        board,
        onSendToBoard: kanban.addIssue,
        getIssue: kanban.findIssue,
        removeIssue: kanban.removeIssue,
    });

    // Which board(s) to show, and whether the LLM board is a grid or a list.
    const [boardView, setBoardView] = useState<BoardView>("default");
    const [kanbanView, setKanbanView] = useState<KanbanView>("board");

    // Search + tag filters applied to the LLM board.
    const filteredBoard = useMemo(
        () => KanbanBoard.filterBoard(kanban.board, options.search, options.selectedTagIds),
        [kanban.board, options.search, options.selectedTagIds],
    );

    // If the focused custom column was deleted, drop the focus so the board returns.
    const { filter, setFilter } = options;
    useEffect(() => {
        if (filter.kind === "custom" && !custom.columns.some((c) => c.id === filter.columnId)) {
            setFilter({ kind: "default" });
        }
    }, [filter, custom.columns, setFilter]);

    return {
        projectId: activeProject?.id,
        options,
        custom,
        board: filteredBoard,
        boardView,
        setBoardView,
        kanbanView,
        setKanbanView,
    };
}
