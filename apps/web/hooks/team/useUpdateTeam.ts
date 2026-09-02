import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import { apiClient } from "@/lib/axios";
import { UPDATE_TEAM } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface UpdateTeamInput {
    teamId: string;
    projectId: string;
    name?: string;
    slug?: string;
    description?: string;
    icon?: IconPick | null;
}

export function useUpdateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateTeamInput) => {
            const res = await apiClient.post<ApiResponse<unknown>>(UPDATE_TEAM, {
                teamId: input.teamId,
                name: input.name,
                slug: input.slug,
                description: input.description,
                icon: input.icon,
            });
            return res.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...PROJECT_QUERY_KEY, variables.projectId],
            });
        },
    });
}
