import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { DELETE_TEAM } from "@/routes/api_routes";
import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import type { ApiResponse } from "@/types/api";

export function useDeleteTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (teamId: string) => {
            await apiClient.delete<ApiResponse<unknown>>(DELETE_TEAM(teamId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
        },
    });
}
