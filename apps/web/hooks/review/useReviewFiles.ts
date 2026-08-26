import { useQuery } from "@tanstack/react-query";
import type { ReviewFile } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_FILES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { REVIEW_QUERY_KEY } from "./useReview";

export function useReviewFiles(projectId: string | undefined, pullNumber: number) {
    return useQuery({
        queryKey: [...REVIEW_QUERY_KEY, projectId, pullNumber, "files"],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ReviewFile[]>>(
                REVIEW_FILES_URL(projectId!, pullNumber),
            );
            return res.data.data;
        },
    });
}
