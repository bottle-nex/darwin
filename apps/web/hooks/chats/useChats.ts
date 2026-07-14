import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CHAT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { Chat } from "@trymatcha/types";

export const CHATS_QUERY_KEY = ["chats"] as const;

/** load all comments (chats) for one issue, oldest first. */
export function useChats(issueId: string | undefined) {
    return useQuery({
        queryKey: [...CHATS_QUERY_KEY, issueId],
        enabled: Boolean(issueId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ chats: Chat[] }>>(CHAT_URL(issueId!));
            return res.data.data.chats;
        },
    });
}

/**
 * Append a chat into an issue's cached list, idempotently (by id).
 * Called by the socket CHAT_CREATED handler. No-ops if the issue's list
 * isn't loaded, it'll be fetched fresh when the issue is opened.
 */
export function upsert_chat(queryClient: QueryClient, chat: Chat) {
    queryClient.setQueryData<Chat[]>([...CHATS_QUERY_KEY, chat.issueId], (prev) => {
        if (!prev) return prev;
        if (prev.some((existing) => existing.id === chat.id)) return prev;
        return [...prev, chat];
    });
}
