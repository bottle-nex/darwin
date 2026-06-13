import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import { DELETE_PROJECT_SECRET_URL } from "@/routes/api_routes";
import { PROJECT_SECRETS_QUERY_KEY } from "./useProjectSecrets";

export function useDeleteProjectSecret() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, key }: { projectId: string; key: string }) => {
            await apiClient.delete<ApiResponse<{ key: string }>>(
                DELETE_PROJECT_SECRET_URL(projectId, key),
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_SECRETS_QUERY_KEY });
        },
    });
}
