import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { REGENERATE_PRODUCT_DIFF_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import { PRODUCT_DIFF_QUERY_KEY } from "./useProductDiff";

export function useRegenerateProductDiff() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, issueId }: { projectId: string; issueId: string }) => {
            const res = await apiClient.post<ApiResponse<{ id: string }>>(
                REGENERATE_PRODUCT_DIFF_URL(projectId, issueId),
            );
            return res.data.data;
        },
        onSuccess: (_data, { projectId }) =>
            queryClient.invalidateQueries({ queryKey: [...PRODUCT_DIFF_QUERY_KEY, projectId] }),
    });
}
