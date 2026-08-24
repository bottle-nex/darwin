import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { GITHUB_LINK, GITHUB_LINK_COMPLETE, GITHUB_LINK_START } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";

export const GITHUB_LINK_QUERY_KEY = ["github-link"];

export const GITHUB_LINK_RETURN_KEY = "github-link-return";

interface RedirectResponse {
    success: boolean;
    url: string;
    message: string;
}

export interface GithubLink {
    githubLogin: string;
}

export function useGithubLink() {
    const token = useUserSessionStore((s) => s.session?.user?.token);
    return useQuery({
        queryKey: GITHUB_LINK_QUERY_KEY,
        enabled: Boolean(token),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<GithubLink | null>>(GITHUB_LINK);
            return res.data.data ?? null;
        },
    });
}

export function useStartGithubLink() {
    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.post<RedirectResponse>(GITHUB_LINK_START);
            return res.data.url;
        },
        onSuccess: (url) => {
            sessionStorage.setItem(
                GITHUB_LINK_RETURN_KEY,
                window.location.pathname + window.location.search,
            );
            window.location.href = url;
        },
    });
}

export function useCompleteGithubLink() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { code: string; state: string }) => {
            const res = await apiClient.post<ApiResponse<GithubLink>>(GITHUB_LINK_COMPLETE, input);
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: GITHUB_LINK_QUERY_KEY });
        },
    });
}
