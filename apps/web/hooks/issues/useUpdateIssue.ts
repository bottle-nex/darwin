import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue, ServerIssueStatus } from "@/types/board";

export interface UpdateIssueInput {
    id: string;
    /** Used only to invalidate the right board query; not sent in the body. */
    project_id: string;
    title?: string;
    summary?: string | null;
    description?: string;
    priority?: 0 | 1 | 2 | 3 | 4;
    status?: ServerIssueStatus;
    /** null moves the issue out of its custom column into its status lane. */
    custom_column_id?: string | null;
    /** Replaces the issue's tags. Omit to leave them untouched; `[]` clears them. */
    tag_ids?: string[];
    /** Replaces the issue's assignees. Omit to leave them untouched; `[]` clears them. */
    assignee_ids?: string[];
    /** ISO string to set, `null` to clear, omitted to leave untouched. */
    start_date?: string | null;
    target_date?: string | null;
}

export function useUpdateIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateIssueInput) => {
            // `project_id` is only for cache invalidation; send the editable fields.
            // Omitted (undefined) fields are dropped by JSON, so they stay untouched.
            const res = await apiClient.patch<ApiResponse<{ issue: BoardIssue }>>(
                ISSUE_URL(input.id),
                {
                    title: input.title,
                    summary: input.summary,
                    description: input.description,
                    priority: input.priority,
                    status: input.status,
                    custom_column_id: input.custom_column_id,
                    tag_ids: input.tag_ids,
                    assignee_ids: input.assignee_ids,
                    start_date: input.start_date,
                    target_date: input.target_date,
                },
            );
            return res.data.data.issue;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
