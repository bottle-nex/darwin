import { useQuery } from "@tanstack/react-query";
import type { ReviewComment } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { REVIEW_COMMENTS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import { REVIEW_QUERY_KEY } from "./useReview";

export const reviewCommentsKey = (projectId: string | undefined, pullNumber: number) => [
    ...REVIEW_QUERY_KEY,
    projectId,
    pullNumber,
    "comments",
];

export function useReviewComments(projectId: string | undefined, pullNumber: number) {
    return useQuery({
        queryKey: reviewCommentsKey(projectId, pullNumber),
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ReviewComment[]>>(
                REVIEW_COMMENTS_URL(projectId!, pullNumber),
            );
            return res.data.data;
        },
    });
}
