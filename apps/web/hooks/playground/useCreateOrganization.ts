import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { CREATE_ORG } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export type CreateOrgInput = {
    name: string;
    slug: string;
    description?: string;
};

export function useCreateOrganization() {
    return useMutation({
        mutationFn: async (input: CreateOrgInput) => {
            const res = await apiClient.post<ApiResponse<{ id: string }>>(CREATE_ORG, input);
            return res.data.data;
        },
    });
}
