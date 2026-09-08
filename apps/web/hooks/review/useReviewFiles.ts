import { useQuery } from "@tanstack/react-query";
import type { ReviewFile } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_FILES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { REVIEW_QUERY_KEY } from "./useReview";

export function useReviewFiles(projectId: string | undefined, pullNumber: number, sha?: string) {
    return useQuery({
        queryKey: [...REVIEW_QUERY_KEY, projectId, pullNumber, "files", sha ?? null],
        enabled: Boolean(projectId),
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<ReviewFile[]>>(
                REVIEW_FILES_URL(projectId!, pullNumber),
                { params: sha ? { sha } : undefined, signal },
            );
            return res.data.data;
        },
    });
}
