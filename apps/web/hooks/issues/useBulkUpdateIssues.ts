import { useMutation, useQueryClient } from "@tanstack/react-query";

import { patchBoardIssueCaches } from "@/hooks/issues/boardCache";
import type { UpdateIssueInput } from "@/hooks/issues/useUpdateIssue";
import { apiClient } from "@/lib/axios";
import { BULK_UPDATE_ISSUES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, BoardLane } from "@/types/board";

export interface BulkUpdateIssuesInput extends Omit<
    UpdateIssueInput,
    "id" | "tag_ids" | "assignee_ids"
> {
    issue_ids: string[];
    add_tag_ids?: string[];
    remove_tag_ids?: string[];
    add_assignee_ids?: string[];
    remove_assignee_ids?: string[];
}

export interface BulkIssueResult {
    updated: string[];
    failed: string[];
    changes: {
        issue: BoardIssue;
        beforeLane: BoardLane;
        afterLane: BoardLane;
    }[];
}

export function useBulkUpdateIssues() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: BulkUpdateIssuesInput) => {
            const res = await apiClient.patch<ApiResponse<BulkIssueResult>>(
                BULK_UPDATE_ISSUES_URL,
                {
                    issue_ids: input.issue_ids,
                    title: input.title,
                    description: input.description,
                    priority: input.priority,
                    status: input.status,
                    custom_column_id: input.custom_column_id,
                    add_tag_ids: input.add_tag_ids,
                    remove_tag_ids: input.remove_tag_ids,
                    add_assignee_ids: input.add_assignee_ids,
                    remove_assignee_ids: input.remove_assignee_ids,
                    start_date: input.start_date,
                    target_date: input.target_date,
                },
            );
            return res.data.data;
        },
        onSuccess: (data, variables) => {
            for (const change of data.changes) {
                patchBoardIssueCaches(queryClient, variables.project_id, change.issue, {
                    beforeLane: change.beforeLane,
                });
            }
        },
    });
}
