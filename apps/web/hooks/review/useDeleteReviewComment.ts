import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { REVIEW_COMMENT_URL } from "@/routes/api_routes";
import { reviewCommentsKey } from "./useReviewComments";

export function useDeleteReviewComment(projectId: string | undefined, pullNumber: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (commentId: string) => {
            await apiClient.delete(REVIEW_COMMENT_URL(projectId!, pullNumber, commentId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewCommentsKey(projectId, pullNumber) });
        },
    });
}
