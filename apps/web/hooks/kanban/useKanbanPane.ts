"use client";
import { useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useKanbanFilterUrlSync } from "./useKanbanFilterUrlSync";
import { useKanbanBoardViewUrlSync } from "./useKanbanBoardViewUrlSync";
import { useCustomKanbanDnd } from "./useCustomKanbanDnd";

export function useKanbanPane() {
    const activeProject = useActiveProject();
    const { data: board } = useBoard(activeProject?.id);
    const projectName = activeProject?.name ?? "";
    const projectId = activeProject?.id;

    useListTemplates(activeProject?.id);
    useKanbanFilterUrlSync(projectId);
    useKanbanBoardViewUrlSync();

    useEffect(() => {
        if (!board) return;
        useKanbanBoardStore.getState().seed(board, projectName);
        useCustomKanbanStore.getState().seed(board);
    }, [board, projectName]);

    const dnd = useCustomKanbanDnd();

    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    const columns = useCustomKanbanStore((s) => s.columns);
    useEffect(() => {
        if (focus.kind === "custom" && !columns.some((c) => c.id === focus.columnId)) {
            setFocus({ kind: "default" });
        }
    }, [focus, columns, setFocus]);

    return { dnd };
}
