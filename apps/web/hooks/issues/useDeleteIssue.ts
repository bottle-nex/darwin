import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeBoardIssueCaches } from "@/hooks/issues/boardCache";
import { apiClient } from "@/lib/axios";
import { ISSUE_URL } from "@/routes/api_routes";
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
            removeBoardIssueCaches(queryClient, variables.project_id, variables.id);
        },
    });
}
