import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CREATE_ISSUE_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";

export interface CreateIssueInput {
    project_id: string;
    title: string;
    summary?: string;
    description: string;
    priority?: 1 | 2 | 3 | 4;
    label?: string;
    /** Set to file the issue into a custom column; omit for the To-Do lane. */
    custom_column_id?: string;
    start_date?: string;
    target_date?: string;
    /** Required (at least one) when not filing into a custom column. */
    assignee_ids?: string[];
    tag_ids?: string[];
}

interface CreatedIssue {
    issue_id: string;
}

export function useCreateIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateIssueInput) => {
            const res = await apiClient.post<ApiResponse<CreatedIssue>>(CREATE_ISSUE_URL, input);
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
