import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BULK_DELETE_ISSUES_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";

export interface BulkDeleteIssuesInput {
    issue_ids: string[];
    /** Used only to target the right board cache entry; not sent in the body. */
    project_id: string;
}

export function useBulkDeleteIssues() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: BulkDeleteIssuesInput) => {
            const res = await apiClient.post<ApiResponse<{ deleted: string[]; failed: string[] }>>(
                BULK_DELETE_ISSUES_URL,
                { issue_ids: input.issue_ids },
            );
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
