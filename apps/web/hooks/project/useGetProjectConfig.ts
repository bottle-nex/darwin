import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { GET_PROJECT_CONFIG_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { ProjectConfig } from "@/types/project";

import { PROJECT_QUERY_KEY } from "./useGetProject";

/**
 * Fetch a project's config. A project with no config row yet resolves to the
 * server-side defaults rather than an error.
 */
export function useGetProjectConfig(projectId: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...PROJECT_QUERY_KEY, projectId, "config"],
        enabled: Boolean(token) && Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ProjectConfig>>(
                GET_PROJECT_CONFIG_URL(projectId!),
            );
            return res.data.data;
        },
    });
}
