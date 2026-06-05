import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { LIST_ORG } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { Organization } from "@/types/organization";

export const ORGANIZATIONS_QUERY_KEY = ["playground", "preload"] as const;

export function useFetchOrganizations() {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: ORGANIZATIONS_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<Organization[]>>(LIST_ORG);
            return res.data.data;
        },
    });
}