import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { DELETE_TAG_URL } from "@/routes/api_routes";
import { TAGS_QUERY_KEY } from "@/hooks/tags/useListTags";
import type { ApiResponse } from "@/types/api";

export interface DeleteTagInput {
    projectId: string;
    tagId: string;
}

export function useDeleteTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: DeleteTagInput) => {
            const res = await apiClient.delete<ApiResponse<{ id: string }>>(
                DELETE_TAG_URL(input.projectId, input.tagId),
            );
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...TAGS_QUERY_KEY, variables.projectId],
            });
        },
    });
}
