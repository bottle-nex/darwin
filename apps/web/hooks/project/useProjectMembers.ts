import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ProjectRole } from "@trymatcha/types";
import { LIST_PROJECT_MEMBERS_URL } from "@/routes/api_routes";

export interface ProjectMember {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: ProjectRole;
}

export const PROJECT_MEMBERS_QUERY_KEY = ["project-members"] as const;

/** Lists a project's distinct members (across its teams) with their highest role. */
export function useProjectMembers(projectId: string | undefined) {
    return useQuery({
        queryKey: [...PROJECT_MEMBERS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ members: ProjectMember[] }>>(
                LIST_PROJECT_MEMBERS_URL(projectId!),
            );
            return res.data.data.members;
        },
    });
}
