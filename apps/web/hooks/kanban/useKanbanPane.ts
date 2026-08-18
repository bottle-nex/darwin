"use client";
import { useEffect, useRef } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useKanbanFilterUrlSync } from "./useKanbanFilterUrlSync";
import { useCustomKanbanDnd } from "./useCustomKanbanDnd";

export function useKanbanPane() {
    const activeProject = useActiveProject();
    const { data: board } = useBoard(activeProject?.id);
    const projectName = activeProject?.name ?? "";
    const projectId = activeProject?.id;

    useListTemplates(activeProject?.id);
    useKanbanFilterUrlSync();

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

    const lastProjectRef = useRef(projectId);
    useEffect(() => {
        const previous = lastProjectRef.current;
        lastProjectRef.current = projectId;
        if (previous && projectId && previous !== projectId) {
            useKanbanFilterStore.getState().clearAll();
        }
    }, [projectId]);

    return { dnd };
}
