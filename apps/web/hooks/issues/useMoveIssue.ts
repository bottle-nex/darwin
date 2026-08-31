"use client";

import { useQueryClient } from "@tanstack/react-query";

import { moveBoardIssueCaches, reconcileBoardProject } from "@/hooks/issues/boardCache";
import { useBulkUpdateIssues } from "@/hooks/issues/useBulkUpdateIssues";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/lib/toast";

/**
 * Moving issues between boards, however it was asked for — a menu, a chip, the
 * command palette or a drag. The move lands in the cache first and rolls back if
 * the write fails, so every surface feels the same.
 */
export function useMoveIssue() {
    const projectId = useActiveProject()?.id;
    const queryClient = useQueryClient();
    const updateIssue = useUpdateIssue();
    const bulkUpdateIssues = useBulkUpdateIssues();

    return (issueIds: string[], columnId: string | null) => {
        if (!projectId || issueIds.length === 0) return;

        for (const issueId of issueIds) {
            moveBoardIssueCaches(queryClient, projectId, issueId, columnId);
        }

        const onError = () => {
            reconcileBoardProject(queryClient, projectId);
            toast.error("Couldn't move the issue.");
        };

        if (issueIds.length > 1) {
            bulkUpdateIssues.mutate(
                { issue_ids: issueIds, project_id: projectId, custom_column_id: columnId },
                { onError },
            );
            return;
        }
        updateIssue.mutate(
            { id: issueIds[0], project_id: projectId, custom_column_id: columnId },
            { onError },
        );
    };
}
