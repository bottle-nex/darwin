import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { LIST_INVITES_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import type { ApiResponse } from "@/types/api";
import type { InvitePreview } from "@/types/types.invitation";

export default function useFetchInvites() {
    const session_token = useUserSessionStore((s) => s.session?.user?.token);

    return useQuery({
        queryKey: ["invitations"],
        enabled: Boolean(session_token),
        retry: false,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<InvitePreview[]>>(LIST_INVITES_URL);
            return res.data.data;
        },
    });
}
