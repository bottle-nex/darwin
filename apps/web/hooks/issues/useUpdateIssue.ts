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
    description?: string;
    priority?: 1 | 2 | 3 | 4;
    /** null clears the label. */
    label?: string | null;
    status?: ServerIssueStatus;
    /** null moves the issue out of its custom column into its status lane. */
    custom_column_id?: string | null;
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
                    description: input.description,
                    priority: input.priority,
                    label: input.label,
                    status: input.status,
                    custom_column_id: input.custom_column_id,
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
