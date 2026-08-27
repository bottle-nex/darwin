"use client";

import { useMemo } from "react";

import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { CustomKanbanMappers } from "@/lib/kanban/CustomKanbanMappers";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import type { CustomColumn } from "@/types/kanban-custom";

export function useFilteredCustomColumns(): CustomColumn[] {
    const projectId = useActiveProject()?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const overlayActive = useCustomKanbanStore((state) => state.overlayActive);
    const overlayColumns = useCustomKanbanStore((state) => state.columns);

    const scope = feed.scope;
    const columns = useMemo(
        () =>
            CustomKanbanMappers.boardToColumns({
                columns:
                    scope.kind === "chapter"
                        ? (metadata?.columns ?? []).filter(
                              (column) => column.chapterId === scope.chapterId,
                          )
                        : [],
                issues: feed.rows,
            }),
        [metadata?.columns, feed.rows, scope],
    );

    return overlayActive ? overlayColumns : columns;
}
