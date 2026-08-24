import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewHeader } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_CLOSE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { REVIEW_QUERY_KEY } from "./useReview";

export function useCloseReview(projectId: string | undefined, pullNumber: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.post<ApiResponse<ReviewHeader>>(
                REVIEW_CLOSE_URL(projectId!, pullNumber),
            );
            return res.data.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData([...REVIEW_QUERY_KEY, projectId, pullNumber], data);
        },
    });
}
