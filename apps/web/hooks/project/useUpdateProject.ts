import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import { UPDATE_PROJECT_URL } from "@/routes/api_routes";
import { PROJECT_QUERY_KEY } from "./useGetProject";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { DASHBOARD_QUERY_KEY } from "@/hooks/dashboard/useGetDashboard";
import type { KanbanOptionView } from "@/types/project";

export interface UpdateProjectInput {
    project_id: string;
    name?: string;
    slug?: string;
    summary?: string;
    description?: string;
    tour_completed?: boolean;
    kanban_option_view?: KanbanOptionView;
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateProjectInput) => {
            const res = await apiClient.patch<ApiResponse<unknown>>(UPDATE_PROJECT_URL, input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
        },
    });
}
