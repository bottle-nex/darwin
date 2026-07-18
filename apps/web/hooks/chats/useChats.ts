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

/** Marks a chat as a local echo not yet confirmed by the CHAT_CREATED broadcast. */
const OPTIMISTIC_ID_PREFIX = "optimistic:";

/**
 * Builds the chat shown the instant the commenter hits send, before the
 * server confirms it. `sender` only needs the fields the chat bubble renders
 * — the rest of `User` is stubbed since this row is replaced wholesale once
 * the real broadcast lands.
 */
export function build_optimistic_chat(
    issueId: string,
    message: string,
    repliedTo: Chat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): Chat {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
        issueId,
        message,
        isDeleted: false,
        senderId: sender.id,
        sender: sender as unknown as Chat["sender"],
        repliedToId: repliedTo?.id ?? null,
        repliedTo: repliedTo ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/** Appends the commenter's own optimistic chat into the cached list right away. */
export function add_chat(queryClient: QueryClient, chat: Chat) {
    queryClient.setQueryData<Chat[]>([...CHATS_QUERY_KEY, chat.issueId], (prev) =>
        prev ? [...prev, chat] : prev,
    );
}

/**
 * Append a chat into an issue's cached list, idempotently (by id). Called by
 * the socket CHAT_CREATED handler — replaces the commenter's own pending
 * optimistic echo (same sender + message) if one is waiting, otherwise just
 * appends. No-ops if the issue's list isn't loaded, it'll be fetched fresh
 * when the issue is opened.
 */
export function upsert_chat(queryClient: QueryClient, chat: Chat) {
    queryClient.setQueryData<Chat[]>([...CHATS_QUERY_KEY, chat.issueId], (prev) => {
        if (!prev) return prev;
        if (prev.some((existing) => existing.id === chat.id)) return prev;
        const pendingIndex = prev.findIndex(
            (existing) =>
                existing.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
                existing.senderId === chat.senderId &&
                existing.message === chat.message,
        );
        if (pendingIndex === -1) return [...prev, chat];
        const next = [...prev];
        next[pendingIndex] = chat;
        return next;
    });
}
