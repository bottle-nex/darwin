import { useQuery } from "@tanstack/react-query";
import type { ReviewCommit } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_COMMITS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { REVIEW_QUERY_KEY } from "./useReview";

export function useReviewCommits(projectId: string | undefined, pullNumber: number | null) {
    return useQuery({
        queryKey: [...REVIEW_QUERY_KEY, projectId, pullNumber, "commits"],
        enabled: Boolean(projectId) && pullNumber !== null,
        queryFn: async ({ signal }) => {
            const res = await apiClient.get<ApiResponse<ReviewCommit[]>>(
                REVIEW_COMMITS_URL(projectId!, pullNumber!),
                { signal },
            );
            return res.data.data;
        },
    });
}
