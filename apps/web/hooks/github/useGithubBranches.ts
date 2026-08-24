import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { GITHUB_REPO_BRANCHES } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { GithubBranch } from "@/types/organization";

export function useGithubBranches(orgId: string | undefined, fullName: string | undefined) {
    const [owner, repo] = (fullName ?? "").split("/");
    return useQuery({
        queryKey: ["github", "branches", orgId, fullName],
        enabled: Boolean(orgId) && Boolean(owner) && Boolean(repo),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<GithubBranch[]>>(
                GITHUB_REPO_BRANCHES(orgId!, owner, repo),
            );
            return res.data.data;
        },
    });
}
