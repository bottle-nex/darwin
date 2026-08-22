"use client";

import { useMemo } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { CustomKanbanMappers } from "@/lib/kanban/CustomKanbanMappers";
import type { CustomColumn } from "@/types/kanban-custom";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";

export function useFilteredCustomColumns(): CustomColumn[] {
    const projectId = useActiveProject()?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const overlayActive = useCustomKanbanStore((state) => state.overlayActive);
    const overlayColumns = useCustomKanbanStore((state) => state.columns);

    const columns = useMemo(
        () =>
            CustomKanbanMappers.boardToColumns({
                columns: metadata?.columns ?? [],
                issues: feed.rows,
            }),
        [metadata?.columns, feed.rows],
    );

    return overlayActive ? overlayColumns : columns;
}
