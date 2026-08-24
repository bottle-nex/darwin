import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { TEMPLATES_QUERY_KEY } from "@/hooks/templates/useListTemplates";
import { apiClient } from "@/lib/axios";
import { CREATE_TEMPLATE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueTemplate } from "@/types/issueTemplate";

export interface CreateTemplateInput {
    projectId: string;
    name: string;
    description: string;
    icon?: IconPick;
    isDefault?: boolean;
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateTemplateInput) => {
            const res = await apiClient.post<ApiResponse<IssueTemplate>>(
                CREATE_TEMPLATE_URL(input.projectId),
                {
                    name: input.name,
                    description: input.description,
                    icon: input.icon,
                    is_default: input.isDefault,
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
