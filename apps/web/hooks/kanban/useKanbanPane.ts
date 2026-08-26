"use client";
import { useEffect } from "react";

import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";

import { useCustomKanbanDnd } from "./useCustomKanbanDnd";
import { useFilteredCustomColumns } from "./useFilteredCustomColumns";
import { useFilteredKanbanBoard } from "./useFilteredKanbanBoard";
import { useKanbanBoardViewUrlSync } from "./useKanbanBoardViewUrlSync";
import { useKanbanFilterUrlSync } from "./useKanbanFilterUrlSync";

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
