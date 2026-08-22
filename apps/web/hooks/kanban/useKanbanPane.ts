"use client";
import { useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useKanbanFilterUrlSync } from "./useKanbanFilterUrlSync";
import { useKanbanBoardViewUrlSync } from "./useKanbanBoardViewUrlSync";
import { useCustomKanbanDnd } from "./useCustomKanbanDnd";
import { useFilteredKanbanBoard } from "./useFilteredKanbanBoard";
import { useFilteredCustomColumns } from "./useFilteredCustomColumns";

export function useKanbanPane() {
    const activeProject = useActiveProject();
    const projectId = activeProject?.id;

    useListTemplates(activeProject?.id);
    useKanbanFilterUrlSync(projectId);
    useKanbanBoardViewUrlSync();

    const board = useFilteredKanbanBoard();
    const columns = useFilteredCustomColumns();
    const dnd = useCustomKanbanDnd(board, columns);

    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    useEffect(() => {
        if (focus.kind === "custom" && !columns.some((c) => c.id === focus.columnId)) {
            setFocus({ kind: "default" });
        }
    }, [focus, columns, setFocus]);

    return { dnd };
}
