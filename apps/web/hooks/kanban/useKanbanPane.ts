"use client";
import { useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useCustomKanban } from "./useCustomKanban";

/**
 * Wires the Kanban pane's data sources together. Resolves the active project,
 * fetches the board, and seeds the board/custom-column stores from it whenever
 * fresh data arrives. Board/toolbar state itself lives in Zustand stores
 * (`useKanbanBoardStore`, `useKanbanOptionsStore`, `useCustomKanbanStore`) —
 * components read those directly instead of through this hook. All that's left
 * here is the Custom Kanban's drag-and-drop orchestration (`useCustomKanban`,
 * which needs React Query mutations and dnd-kit's sensors, so it can't be a
 * plain store) and the cross-store guard that clears a stale focus filter.
 */
export function useKanbanPane() {
    const activeProject = useActiveProject();
    const { data: board } = useBoard(activeProject?.id);
    const projectName = activeProject?.name ?? "";

    useEffect(() => {
        if (!board) return;
        useKanbanBoardStore.getState().seed(board, projectName);
        useCustomKanbanStore.getState().seed(board);
    }, [board, projectName]);

    const custom = useCustomKanban({ projectId: activeProject?.id });

    // If the focused custom column was deleted, drop the focus so the board returns.
    const filter = useKanbanOptionsStore((s) => s.filter);
    const setFilter = useKanbanOptionsStore((s) => s.setFilter);
    const columns = useCustomKanbanStore((s) => s.columns);
    useEffect(() => {
        if (filter.kind === "custom" && !columns.some((c) => c.id === filter.columnId)) {
            setFilter({ kind: "default" });
        }
    }, [filter, columns, setFilter]);

    return { custom };
}
