import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ASSIGN_ISSUE_URL, UNASSIGN_ISSUE_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";
import type { BoardIssue } from "@/types/board";

export interface AssignIssueInput {
    id: string;
    project_id: string;
    user_id: string;
}

/** Assign a member to an issue (POST), or pick it for yourself. */
export function useAssignIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, user_id }: AssignIssueInput) => {
            const res = await apiClient.post<ApiResponse<{ issue: BoardIssue }>>(
                ASSIGN_ISSUE_URL(id),
                { user_id },
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

/** Remove a member from an issue (DELETE), or drop it yourself. */
export function useUnassignIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, user_id }: AssignIssueInput) => {
            const res = await apiClient.delete<ApiResponse<{ issue: BoardIssue }>>(
                UNASSIGN_ISSUE_URL(id, user_id),
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
