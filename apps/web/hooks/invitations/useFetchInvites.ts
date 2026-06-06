import { apiClient } from "@/lib/axios";
import { LIST_INVITES_URL } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { ApiResponse } from "@/types/api";
import { InvitePreview } from "@/types/types.invitation";
import { useQuery } from "@tanstack/react-query";

export default function useFetchInvites() {
    const session_token = useUserSessionStore(s => s.session?.user?.token);
    
    return useQuery({
        queryKey: ['invitations'],
        enabled: Boolean(session_token),
        retry: false,
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<InvitePreview[]>>(LIST_INVITES_URL);
            return res.data.data;
        }
    })
} 