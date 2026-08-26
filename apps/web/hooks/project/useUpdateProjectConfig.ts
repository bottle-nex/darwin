import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { UPDATE_PROJECT_CONFIG_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { KanbanOptionView, ProjectConfig } from "@/types/project";

import { PROJECT_QUERY_KEY } from "./useGetProject";

export interface UpdateProjectConfigInput {
    projectId: string;
    kanban_option_view?: KanbanOptionView;
}

export function useUpdateProjectConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, ...config }: UpdateProjectConfigInput) => {
            const res = await apiClient.patch<ApiResponse<ProjectConfig>>(
                UPDATE_PROJECT_CONFIG_URL(projectId),
                config,
            );
            return res.data.data;
        },
        onSuccess: (_data, { projectId }) => {
            queryClient.invalidateQueries({
                queryKey: [...PROJECT_QUERY_KEY, projectId, "config"],
            });
        },
    });
}
