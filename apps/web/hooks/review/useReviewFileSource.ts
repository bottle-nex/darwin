import { useQuery } from "@tanstack/react-query";
import type { ReviewFileSource } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_FILE_SOURCE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { REVIEW_QUERY_KEY } from "./useReview";

export function useReviewFileSource(
    projectId: string | undefined,
    pullNumber: number,
    path: string,
    enabled: boolean,
) {
    return useQuery({
        queryKey: [...REVIEW_QUERY_KEY, projectId, pullNumber, "source", path],
        enabled: Boolean(projectId) && enabled,
        staleTime: Infinity,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ReviewFileSource>>(
                REVIEW_FILE_SOURCE_URL(projectId!, pullNumber),
                { params: { path } },
            );
            return res.data.data;
        },
    });
}
