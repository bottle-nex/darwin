import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewComment } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_COMMENTS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { reviewCommentsKey } from "./useReviewComments";

export const GITHUB_NOT_LINKED = "GITHUB_NOT_LINKED";

export function usePostReviewComment(projectId: string | undefined, pullNumber: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: string) => {
            const res = await apiClient.post<ApiResponse<ReviewComment>>(
                REVIEW_COMMENTS_URL(projectId!, pullNumber),
                { body },
            );
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewCommentsKey(projectId, pullNumber) });
        },
    });
}
