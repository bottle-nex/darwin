import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { LIST_TEMPLATES_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { IssueTemplate } from "@/types/issueTemplate";

export const TEMPLATES_QUERY_KEY = ["issue-templates"] as const;

export function useListTemplates(projectId: string | undefined) {
    return useQuery({
        queryKey: [...TEMPLATES_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ templates: IssueTemplate[] }>>(
                LIST_TEMPLATES_URL(projectId!),
            );
            return res.data.data.templates;
        },
    });
}
