import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CREATE_ISSUE_URL } from "@/routes/api_routes";
import { PROJECT_QUERY_KEY } from "@/hooks/project/useGetProject";
import type { ApiResponse } from "@/types/api";

export interface CreateIssueInput {
    project_id: string;
    title: string;
    description: string;
    priority?: 1 | 2 | 3 | 4;
    label?: string;
}

interface CreatedIssue {
    issue_id: string;
}

export function useCreateIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateIssueInput) => {
            const res = await apiClient.post<ApiResponse<CreatedIssue>>(CREATE_ISSUE_URL, input);
            return res.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...PROJECT_QUERY_KEY, variables.project_id],
            });
        },
    });
}
