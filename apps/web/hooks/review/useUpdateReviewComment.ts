import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewComment } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { REVIEW_COMMENT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

import { reviewCommentsKey } from "./useReviewComments";

export function useUpdateReviewComment(projectId: string | undefined, pullNumber: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
            const res = await apiClient.patch<ApiResponse<ReviewComment>>(
                REVIEW_COMMENT_URL(projectId!, pullNumber, commentId),
                { body },
            );
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewCommentsKey(projectId, pullNumber) });
        },
    });
}
