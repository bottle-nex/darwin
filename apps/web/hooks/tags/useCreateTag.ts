import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CREATE_TAG_URL } from "@/routes/api_routes";
import { TAGS_QUERY_KEY } from "@/hooks/tags/useListTags";
import type { ApiResponse } from "@/types/api";
import type { Tag } from "@/types/tags";

export interface CreateTagInput {
    projectId: string;
    name: string;
    color: string;
}

export function useCreateTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateTagInput) => {
            const res = await apiClient.post<ApiResponse<Tag>>(CREATE_TAG_URL(input.projectId), {
                name: input.name,
                color: input.color,
            });
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...TAGS_QUERY_KEY, variables.projectId],
            });
        },
    });
}
