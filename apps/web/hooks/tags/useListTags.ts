import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { LIST_TAGS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { Tag } from "@/types/tags";

export const TAGS_QUERY_KEY = ["tags"] as const;

export function useListTags(projectId: string | undefined) {
    return useQuery({
        queryKey: [...TAGS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ tags: Tag[] }>>(
                LIST_TAGS_URL(projectId!),
            );
            return res.data.data.tags;
        },
    });
}
