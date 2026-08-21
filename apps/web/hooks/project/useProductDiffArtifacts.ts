import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { PRODUCT_DIFF_ARTIFACT_URLS_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import { PRODUCT_DIFF_QUERY_KEY } from "./useProductDiffs";

const REFRESH_MS = 4 * 60_000;
const STALE_MS = 3.5 * 60_000;

/**
 * Fetches temporary image links for the screenshots currently on screen.
 *
 * Only the selected target's images are requested, because a preview can hold close to a hundred
 * pictures and the reader looks at a handful. The refresh matters as much as the fetch: the links
 * expire after fifteen minutes and this panel is often left open far longer, so without it the
 * screenshots would quietly go blank mid-review.
 *
 * @example
 * const { data } = useProductDiffArtifacts(projectId, diffId, ["shots/nav/default/desktop/head.png"]);
 * // { "shots/nav/default/desktop/head.png": "https://minio.local/...?X-Amz-Signature=..." }
 */
export function useProductDiffArtifacts(
    projectId: string | undefined,
    productDiffId: string | null,
    keys: string[],
) {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    const sorted = [...keys].sort();

    return useQuery({
        queryKey: [...PRODUCT_DIFF_QUERY_KEY, projectId, productDiffId, "artifacts", sorted],
        enabled:
            Boolean(token) && Boolean(projectId) && Boolean(productDiffId) && sorted.length > 0,
        staleTime: STALE_MS,
        refetchInterval: REFRESH_MS,
        refetchOnWindowFocus: true,
        queryFn: async () => {
            const res = await apiClient.post<ApiResponse<{ urls: Record<string, string> }>>(
                PRODUCT_DIFF_ARTIFACT_URLS_URL(projectId!, productDiffId!),
                { keys: sorted },
            );
            return res.data.data.urls;
        },
    });
}
