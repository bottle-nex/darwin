import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { INVITES_PREVIEW_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { InvitePreview } from "@/types/types.invitation";

export default function useInvitationPreview(token: string) {
    const session_token = useUserSessionStore((s) => s.session?.user?.token);

    return useQuery({
        queryKey: ["invitation", token],
        enabled: Boolean(token) && Boolean(session_token),
        retry: false,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<InvitePreview>>(INVITES_PREVIEW_URL(token));
            return res.data.data;
        },
    });
}
