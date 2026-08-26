import { useQuery } from "@tanstack/react-query";
import type { ReviewHeader } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export const REVIEW_QUERY_KEY = ["review"];

export function useReview(projectId: string | undefined, pullNumber: number) {
    return useQuery({
        queryKey: [...REVIEW_QUERY_KEY, projectId, pullNumber],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ReviewHeader>>(
                REVIEW_URL(projectId!, pullNumber),
            );
            return res.data.data;
        },
    });
}
