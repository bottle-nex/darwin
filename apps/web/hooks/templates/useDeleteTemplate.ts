import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { DELETE_TEMPLATE_URL } from "@/routes/api_routes";
import { TEMPLATES_QUERY_KEY } from "@/hooks/templates/useListTemplates";
import type { ApiResponse } from "@/types/api";

export interface DeleteTemplateInput {
    projectId: string;
    templateId: string;
}

export function useDeleteTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: DeleteTemplateInput) => {
            const res = await apiClient.delete<ApiResponse<{ id: string }>>(
                DELETE_TEMPLATE_URL(input.projectId, input.templateId),
            );
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...TEMPLATES_QUERY_KEY, variables.projectId],
            });
        },
    });
}
