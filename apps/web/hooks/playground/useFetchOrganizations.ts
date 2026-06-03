import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { PRELOAD_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { PreloadData } from "@/types/organization";

export function useFetchOrganizations() {
    const token = useUserSessionStore((s) => s.session?.user?.token);

    return useQuery({
        queryKey: ["playground", "preload"],
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<PreloadData>>(PRELOAD_URL);
            return res.data.data;
        },
    });
}
