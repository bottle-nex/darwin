import { useQuery } from "@tanstack/react-query";
import type { ProductDiffDetail } from "@trydarwin/types";

import { apiClient } from "@/lib/axios";
import { PRODUCT_DIFF_URL } from "@/routes/api_routes";
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
