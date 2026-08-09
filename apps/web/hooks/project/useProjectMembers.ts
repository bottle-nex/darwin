import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ProjectRole } from "@trymatcha/types";
import { LIST_PROJECT_MEMBERS_URL } from "@/routes/api_routes";

export interface ProjectMember {
    id: string;
    /** The underlying ProjectMember row's id — the right id to reference this
     *  person's project membership by (e.g. a chat @-mention), as opposed to
     *  `id`, which is their User id. */
    memberId: string;
    name: string | null;
    email: string;
    image: string | null;
    role: ProjectRole;
}

export const PROJECT_MEMBERS_QUERY_KEY = ["project-members"] as const;

/**
 * Lists a project's distinct members (across its teams) with their highest role.
 * Pass `query` to search server-side instead of fetching everyone — an empty
 * string still switches the server into search mode, capping the result size,
 * which is what an @-mention picker should always do.
 */
export function useProjectMembers(projectId: string | undefined, query?: string) {
    return useQuery({
        queryKey: [...PROJECT_MEMBERS_QUERY_KEY, projectId, query ?? null],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ members: ProjectMember[] }>>(
                LIST_PROJECT_MEMBERS_URL(projectId!, query),
            );
            return res.data.data.members;
        },
    });
}
