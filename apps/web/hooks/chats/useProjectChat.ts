import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { PROJECT_CHAT_URL } from "@/routes/api_routes";
import type { ApiResponse } from "@/types/api";
import type { LabelledReference, ProjectChat } from "@trymatcha/types";

export const PROJECT_CHATS_QUERY_KEY = ["project-chats"] as const;

/** load all messages for one project's general chat, oldest first. */
export function useProjectChat(projectId: string | undefined) {
    return useQuery({
        queryKey: [...PROJECT_CHATS_QUERY_KEY, projectId],
        enabled: Boolean(projectId),
        queryFn: async () => {
            const res = await apiClient.get<ApiResponse<{ chats: ProjectChat[] }>>(
                PROJECT_CHAT_URL(projectId!),
            );
            return res.data.data.chats;
        },
    });
}

/** Marks a chat as a local echo not yet confirmed by the PROJECT_CHAT_CREATED broadcast. */
const OPTIMISTIC_ID_PREFIX = "optimistic:";

/**
 * Builds the chat shown the instant the sender hits send, before the server
 * confirms it. `sender` only needs the fields the chat bubble renders — the
 * rest of `User` is stubbed since this row is replaced wholesale once the
 * real broadcast lands.
 */
export function build_optimistic_project_chat(
    projectId: string,
    message: string,
    references: LabelledReference[],
    repliedTo: ProjectChat | null,
    sender: { id: string; name: string | null; email: string; image: string | null },
): ProjectChat {
    return {
        id: `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`,
        projectId,
        message,
        isDeleted: false,
        senderId: sender.id,
        sender: sender as unknown as ProjectChat["sender"],
        repliedToId: repliedTo?.id ?? null,
        repliedTo: repliedTo ?? null,
        references: references as ProjectChat["references"],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/** Appends the sender's own optimistic chat into the cached list right away. */
export function add_project_chat(queryClient: QueryClient, chat: ProjectChat) {
    queryClient.setQueryData<ProjectChat[]>([...PROJECT_CHATS_QUERY_KEY, chat.projectId], (prev) =>
        prev ? [...prev, chat] : prev,
    );
}

/**
 * Append a chat into a project's cached list, idempotently (by id). Called by
 * the socket PROJECT_CHAT_CREATED handler — replaces the sender's own pending
 * optimistic echo (same sender + message) if one is waiting, otherwise just
 * appends. No-ops if the project's list isn't loaded, it'll be fetched fresh
 * when the project chat is opened.
 */
/**
 * Flags a project chat as deleted in place and flips the embedded quote copy
 * on any replies to it, so quotes switch to the "Message deleted" rendering.
 * Shared by the deleter's optimistic update and the PROJECT_CHAT_DELETED
 * broadcast handler — idempotent, so running both is fine.
 */
export function mark_project_chat_deleted(queryClient: QueryClient, chat: ProjectChat) {
    queryClient.setQueryData<ProjectChat[]>([...PROJECT_CHATS_QUERY_KEY, chat.projectId], (prev) =>
        prev?.map((existing) => {
            const next = existing.id === chat.id ? { ...existing, isDeleted: true } : existing;
            return next.repliedToId === chat.id && next.repliedTo
                ? { ...next, repliedTo: { ...next.repliedTo, isDeleted: true } }
                : next;
        }),
    );
}

export function upsert_project_chat(queryClient: QueryClient, chat: ProjectChat) {
    queryClient.setQueryData<ProjectChat[]>(
        [...PROJECT_CHATS_QUERY_KEY, chat.projectId],
        (prev) => {
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
        },
    );
}
