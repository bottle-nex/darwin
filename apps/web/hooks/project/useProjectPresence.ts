import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { PROJECT_PRESENCE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

const PRESENCE_REFETCH_MS = 30_000;

export const PROJECT_PRESENCE_QUERY_KEY = ["project-presence"] as const;

export function useProjectPresence(projectId: string | undefined) {
    return useQuery({
        queryKey: [...PROJECT_PRESENCE_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        refetchInterval: PRESENCE_REFETCH_MS,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ online: string[] }>>(
                PROJECT_PRESENCE_URL(projectId!),
            );
            return new Set(res.data.data.online);
        },
    });
}
