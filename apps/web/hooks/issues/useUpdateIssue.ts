import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_URL } from "@/routes/api_routes";
import { updateBoardIssue } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";
import type { ServerIssueStatus } from "@/types/board";
import type { Issue } from "@trymatcha/types";

export interface UpdateIssueInput {
    id: string;
    /** Used only to target the right board cache entry; not sent in the body. */
    project_id: string;
    title?: string;
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
            // Omitted (undefined) fields are dropped by JSON, so they stay untouched.
            const res = await apiClient.patch<ApiResponse<{ issue: Issue }>>(ISSUE_URL(input.id), {
                title: input.title,
                description: input.description,
                priority: input.priority,
                status: input.status,
                custom_column_id: input.custom_column_id,
                tag_ids: input.tag_ids,
                assignee_ids: input.assignee_ids,
                start_date: input.start_date,
                target_date: input.target_date,
            });
            return res.data.data.issue;
        },
        onSuccess: (data, variables) => {
            updateBoardIssue(queryClient, variables.project_id, data);
        },
    });
}
