import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import { apiClient } from "@/lib/axios";
import { CREATE_TEAM } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface CreateTeamInput {
    projectId: string;
    name: string;
    slug: string;
    description?: string;
}

interface CreatedTeam {
    id: string;
}

export function useCreateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateTeamInput) => {
            const res = await apiClient.post<ApiResponse<CreatedTeam>>(CREATE_TEAM, input);
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...PROJECT_QUERY_KEY, variables.projectId],
            });
        },
    });
}
