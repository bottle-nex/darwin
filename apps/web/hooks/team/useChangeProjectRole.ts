import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectRole } from "@trymatcha/types";

import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { apiClient } from "@/lib/axios";
import { CHANGE_PROJECT_ROLE } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export function useChangeProjectRole(projectId: string | undefined, teamId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: ProjectRole }) => {
            if (!projectId) throw new Error("missing project");
            const res = await apiClient.patch<ApiResponse<null>>(CHANGE_PROJECT_ROLE(projectId), {
                userId,
                role,
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
        },
    });
}
