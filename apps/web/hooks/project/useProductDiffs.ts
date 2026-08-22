import { useQuery } from "@tanstack/react-query";
import type { ProductDiffSummary } from "@trymatcha/types";
import { apiClient } from "@/lib/axios";
import { PRODUCT_DIFFS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";

export const PRODUCT_DIFF_QUERY_KEY = ["product-diffs"] as const;

export function useProductDiffs(projectId: string | undefined) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: [...PRODUCT_DIFF_QUERY_KEY, projectId],
        enabled: Boolean(token) && Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<ProductDiffSummary[]>>(
                PRODUCT_DIFFS_URL(projectId!),
            );
            return res.data.data;
        },
        refetchInterval: (query) =>
            query.state.data?.some(
                (diff) => diff.status === "Pending" || diff.status === "Generating",
            )
                ? 5_000
                : false,
    });
}
