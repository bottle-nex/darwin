import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { LIST_PROJECT_SECRETS_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface ProjectSecretKey {
    key: string;
    updatedAt: string;
}

export const PROJECT_SECRETS_QUERY_KEY = ["project-secrets"] as const;

export function useProjectSecrets(projectId: string | undefined) {
    return useQuery({
        queryKey: [...PROJECT_SECRETS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ secrets: ProjectSecretKey[] }>>(
                LIST_PROJECT_SECRETS_URL(projectId!),
            );
            return res.data.data.secrets;
        },
    });
}
