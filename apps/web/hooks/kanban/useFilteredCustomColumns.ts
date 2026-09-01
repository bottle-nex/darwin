"use client";

import { useMemo } from "react";

import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";

/** The columns of the space this pane is showing. Empty on the agent board. */
export function useFilteredCustomColumns(): { id: string; title: string }[] {
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);
    const scope = useBoardFeed(projectId).scope;

    return useMemo(() => {
        if (scope.kind !== "space") return [];
        return (metadata?.columns ?? [])
            .filter((column) => column.spaceId === scope.spaceId)
            .map((column) => ({ id: column.id, title: column.label }));
    }, [metadata?.columns, scope]);
}
