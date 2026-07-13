import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CHAT_URL } from "@/routes/api_routes";
import { upsert_chat } from "@/hooks/chats/useChats";
import type { ApiResponse } from "@/types/api";
import type { Chat } from "@trymatcha/types";

export function useCreateChat(issueId: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (message: string) => {
            if (!issueId) throw new Error("Cannot comment on an unsaved issue");
            const res = await apiClient.post<ApiResponse<{ chat: Chat }>>(CHAT_URL(issueId), {
                message,
            });
            return res.data.data.chat;
        },
        onSuccess: (chat) => {
            upsert_chat(queryClient, chat);
        },
    });
}
