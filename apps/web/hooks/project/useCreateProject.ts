import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IconPick } from "@/components/ui/IconPicker";
import { DASHBOARD_QUERY_KEY } from "@/hooks/dashboard/useGetDashboard";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { apiClient } from "@/lib/axios";
import { CREATE_PROJECT } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export interface CreateProjectInput {
    org_id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: IconPick;
    repo?: {
        githubRepoId: string;
        fullName: string;
        htmlUrl: string;
        defaultBranch: string;
    };
}

interface CreatedProject {
    id: string;
    name: string;
    slug: string;
    icon: IconPick | null;
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateProjectInput) => {
            const res = await apiClient.post<ApiResponse<CreatedProject>>(CREATE_PROJECT, input);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
        },
    });
}
