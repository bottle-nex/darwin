import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { GITHUB_CONNECT_START } from "@/routes/api_routes";

/** `ResponseWriter.redirect` puts the target at the top level, not under `data`. */
interface RedirectResponse {
    success: boolean;
    url: string;
    message: string;
}

/**
 * Start the GitHub connection for an org and send the browser to GitHub's
 * install screen. The server returns the install URL at the top-level `url`.
 */
export function useConnectGithub() {
    return useMutation({
        mutationFn: async (orgId: string) => {
            const res = await apiClient.post<RedirectResponse>(GITHUB_CONNECT_START, { orgId });
            return res.data.url;
        },
        onSuccess: (url) => {
            window.location.href = url;
        },
    });
}
