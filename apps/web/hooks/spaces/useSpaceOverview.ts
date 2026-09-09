"use client";

import { useMemo } from "react";

import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { type SpaceProgress, spaceProgressFor } from "@/lib/spaceOverview";

export function useSpaceOverview(spaceId: string): SpaceProgress & { isLoading: boolean } {
    const projectId = useActiveProject()?.id;
    const { data, isLoading } = useBoardColumns(projectId);

    return useMemo(
        () => ({
            ...spaceProgressFor(spaceId, data?.columns ?? [], data?.totals),
            isLoading,
        }),
        [data, spaceId, isLoading],
    );
}
