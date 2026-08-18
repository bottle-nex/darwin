import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ASSIGN_ISSUE_URL, UNASSIGN_ISSUE_URL } from "@/routes/api_routes";
import { updateBoardIssue } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";
import type { Issue } from "@trymatcha/types";

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
            const res = await apiClient.post<ApiResponse<{ issue: Issue }>>(
                ASSIGN_ISSUE_URL(id),
                { user_id },
            );
            return res.data.data.issue;
        },
        onSuccess: (data, variables) => {
            updateBoardIssue(queryClient, variables.project_id, data);
        },
    });
}

/** Remove a member from an issue (DELETE), or drop it yourself. */
export function useUnassignIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, user_id }: AssignIssueInput) => {
            const res = await apiClient.delete<ApiResponse<{ issue: Issue }>>(
                UNASSIGN_ISSUE_URL(id, user_id),
            );
            return res.data.data.issue;
        },
        onSuccess: (data, variables) => {
            updateBoardIssue(queryClient, variables.project_id, data);
        },
    });
}
