import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import { START_PROJECT_SETUP_URL } from "@/routes/api_routes";
import { PROJECT_QUERY_KEY } from "./useGetProject";

/** Kick off the one-time brief generation for a project's connected repo. */
export function useStartSetup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectId: string) => {
            const res = await apiClient.post<ApiResponse<unknown>>(
                START_PROJECT_SETUP_URL(projectId),
                {},
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
        },
    });
}
