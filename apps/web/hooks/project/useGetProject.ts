import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { GET_PROJECT } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { ProjectDetail } from "@/types/project";

export const PROJECT_QUERY_KEY = ["project"] as const;

/**
 * Fetch a single project (with its teams) by id. Only runs once the user is
 * authenticated and a `projectId` is known.
 */
export function useGetProject(projectId: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...PROJECT_QUERY_KEY, projectId],
        enabled: Boolean(token) && Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ProjectDetail>>(GET_PROJECT(projectId!));
            return res.data.data;
        },
        refetchInterval: (query) => (query.state.data?.planStatus === "Generating" ? 4000 : false),
    });
}
