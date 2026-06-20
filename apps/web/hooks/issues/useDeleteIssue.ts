import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ISSUE_URL } from "@/routes/api_routes";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import type { ApiResponse } from "@/types/api";

export interface DeleteIssueInput {
    id: string;
    project_id: string;
}

export function useDeleteIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: DeleteIssueInput) => {
            const res = await apiClient.delete<ApiResponse<{ ok: boolean }>>(ISSUE_URL(id));
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...BOARD_QUERY_KEY, variables.project_id],
            });
        },
    });
}
