import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { GITHUB_REPOS } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { GithubRepo } from "@/types/organization";

/**
 * List the repos accessible to an org's GitHub installation. Only runs when the
 * org is connected and an `orgId` is known.
 */
export function useGithubRepos(orgId: string | undefined, connected: boolean) {
    return useQuery({
        queryKey: ["github", "repos", orgId],
        enabled: Boolean(orgId) && connected,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<GithubRepo[]>>(GITHUB_REPOS(orgId!));
            return res.data.data;
        },
    });
}
