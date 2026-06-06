import { apiClient } from "@/lib/axios";
import { INVITES_PREVIEW_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { ApiResponse } from "@/types/api";
import { InvitePreview } from "@/types/types.invitation";
import { useQuery } from "@tanstack/react-query";

export default function useInvitationPreview(token: string) {
    // Subscribe reactively: the session is hydrated in an effect (SessionSetter), so the
    // query must re-enable when the token appears. SessionServices.get_token() reads a
    // one-time snapshot and would not trigger that re-evaluation.
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
