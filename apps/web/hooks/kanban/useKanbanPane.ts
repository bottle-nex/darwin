"use client";
import { useEffect } from "react";

import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardScope } from "@/types/board";

import { useFilteredCustomColumns } from "./useFilteredCustomColumns";
import { useKanbanFilterUrlSync } from "./useKanbanFilterUrlSync";

export function useKanbanPane(scope: BoardScope) {
    const activeProject = useActiveProject();

    useListTemplates(activeProject?.id);
    useKanbanFilterUrlSync(activeProject?.id);

    const columns = useFilteredCustomColumns();
    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);

    useEffect(() => {
        // Focus is a single store shared by every pane, so it also has to be
        // cleared when it points at the board this pane isn't showing.
        const belongsToPane =
            scope.kind === "agent" ? focus.kind !== "custom" : focus.kind !== "llm";
        const columnMissing =
            focus.kind === "custom" && !columns.some((c) => c.id === focus.columnId);
        if (!belongsToPane || columnMissing) setFocus({ kind: "default" });
    }, [focus, columns, setFocus, scope]);
}
