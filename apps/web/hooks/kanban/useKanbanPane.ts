"use client";
import { useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useCustomKanbanDnd } from "./useCustomKanbanDnd";

export function useKanbanPane() {
    const activeProject = useActiveProject();
    const { data: board } = useBoard(activeProject?.id);
    const projectName = activeProject?.name ?? "";

    useListTemplates(activeProject?.id);

    useEffect(() => {
        if (!board) return;
        useKanbanBoardStore.getState().seed(board, projectName);
        useCustomKanbanStore.getState().seed(board);
    }, [board, projectName]);

    const dnd = useCustomKanbanDnd();

    const filter = useKanbanOptionsStore((s) => s.filter);
    const setFilter = useKanbanOptionsStore((s) => s.setFilter);
    const columns = useCustomKanbanStore((s) => s.columns);
    useEffect(() => {
        if (filter.kind === "custom" && !columns.some((c) => c.id === filter.columnId)) {
            setFilter({ kind: "default" });
        }
    }, [filter, columns, setFilter]);

    return { dnd };
}
