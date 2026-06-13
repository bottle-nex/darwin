import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import { DELETE_PROJECT_URL } from "@/routes/api_routes";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { DASHBOARD_QUERY_KEY } from "@/hooks/dashboard/useGetDashboard";

export function useDeleteProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectId: string) => {
            const res = await apiClient.delete<ApiResponse<{ id: string }>>(DELETE_PROJECT_URL, {
                data: { project_id: projectId },
            });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
        },
    });
}
