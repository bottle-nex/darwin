import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { TEMPLATES_QUERY_KEY } from "@/hooks/templates/useListTemplates";
import { apiClient } from "@/lib/axios";
import { UPDATE_TEMPLATE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueTemplate } from "@/types/issueTemplate";

export interface UpdateTemplateInput {
    projectId: string;
    templateId: string;
    name?: string;
    description?: string;
    icon?: IconPick;
    isDefault?: boolean;
}

export function useUpdateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateTemplateInput) => {
            const res = await apiClient.patch<ApiResponse<IssueTemplate>>(
                UPDATE_TEMPLATE_URL(input.projectId, input.templateId),
                {
                    ...(input.name !== undefined ? { name: input.name } : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                    ...(input.icon !== undefined ? { icon: input.icon } : {}),
                    ...(input.isDefault !== undefined ? { is_default: input.isDefault } : {}),
                },
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
