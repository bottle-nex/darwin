"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useBoard } from "@/hooks/issues/useBoard";
import { filterBoard } from "./data";
import type { BoardView, KanbanView } from "./types";
import { useKanbanBoard } from "./useKanbanBoard";
import { useKanbanOptions } from "./useKanbanOptions";
import { useCustomKanban } from "./customkanban/useCustomKanban";

/**
 * All the data, board hooks, and view state the Kanban pane needs — kept out of
 * the component so `KanbanMainPane` stays a thin layout. Resolves the active
 * project from the URL, wires the two boards together (a custom card can be filed
 * onto the LLM board and back), and exposes the filtered board plus the toolbar's
 * view toggles.
 */
export function useKanbanPane() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

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
    const [issuePlaneOpen, setIssuePlaneOpen] = useState(false);

    // Search + label filters applied to the LLM board.
    const filteredBoard = useMemo(
        () => filterBoard(kanban.board, options.search, options.selectedLabels),
        [kanban.board, options.search, options.selectedLabels],
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
        issuePlaneOpen,
        setIssuePlaneOpen,
    };
}
