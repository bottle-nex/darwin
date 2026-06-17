import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { UPDATE_TAG_URL } from "@/routes/api_routes";
import { TAGS_QUERY_KEY } from "@/hooks/tags/useListTags";
import type { ApiResponse } from "@/types/api";
import type { Tag } from "@/types/tags";

export interface UpdateTagInput {
    projectId: string;
    tagId: string;
    name?: string;
    color?: string;
}

export function useUpdateTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateTagInput) => {
            const res = await apiClient.patch<ApiResponse<Tag>>(
                UPDATE_TAG_URL(input.projectId, input.tagId),
                { name: input.name, color: input.color },
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
