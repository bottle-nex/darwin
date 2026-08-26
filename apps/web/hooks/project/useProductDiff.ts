import { useQuery } from "@tanstack/react-query";
import type { ProductDiffDetail } from "@trymatcha/types";

import { apiClient } from "@/lib/axios";
import { PRODUCT_DIFF_REPLAY_URL, PRODUCT_DIFF_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";

export const PRODUCT_DIFF_QUERY_KEY = ["product-diffs"] as const;

export function useProductDiff(projectId: string | undefined, productDiffId: string | null) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...PRODUCT_DIFF_QUERY_KEY, projectId, productDiffId],
        enabled: Boolean(token) && Boolean(projectId) && Boolean(productDiffId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ProductDiffDetail>>(
                PRODUCT_DIFF_URL(projectId!, productDiffId!),
            );
            return res.data.data;
        },
        refetchInterval: (query) =>
            query.state.data?.status === "Pending" || query.state.data?.status === "Generating"
                ? 3_000
                : false,
    });
}

export function useProductDiffReplayLaunch(
    projectId: string | undefined,
    productDiffId: string | null,
    artifactId: string | null,
) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...PRODUCT_DIFF_QUERY_KEY, projectId, productDiffId, "replay", artifactId],
        enabled:
            Boolean(token) && Boolean(projectId) && Boolean(productDiffId) && Boolean(artifactId),
        staleTime: 3.5 * 60_000,
        refetchInterval: 4 * 60_000,
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const res = await apiClient.post<ApiResponse<{ url: string }>>(
                PRODUCT_DIFF_REPLAY_URL(projectId!, productDiffId!),
                { artifactId },
            );
            return res.data.data;
        },
    });
}
