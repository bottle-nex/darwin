import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { REJECT_INVITE_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";

export default function useRejectInvite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (token: string) => {
            const res = await apiClient.post<ApiResponse<null>>(REJECT_INVITE_URL, { token });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invitations", "pending"] });
        },
    });
}
