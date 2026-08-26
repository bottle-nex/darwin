import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { DASHBOARD_QUERY_KEY } from "@/hooks/dashboard/useGetDashboard";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { apiClient } from "@/lib/axios";
import { UPDATE_PROJECT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { KanbanOptionView } from "@/types/project";

import { PROJECT_QUERY_KEY } from "./useGetProject";

export interface UpdateProjectInput {
    project_id: string;
    name?: string;
    slug?: string;
    summary?: string;
    description?: string;
    icon?: IconPick;
    plan_md?: string;
    tour_completed?: boolean;
    kanban_option_view?: KanbanOptionView;
    product_diff_enabled?: boolean;
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
