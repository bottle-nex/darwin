"use client";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    InboundSocketMessageType,
    type LabelledReference,
    type ProjectChat,
} from "@trymatcha/types";
import { toast } from "@/lib/toast";
import SessionServices from "@/lib/session";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { OPTIMISTIC_ID_PREFIX } from "./useChats";
import { toggle_project_chat_reaction } from "./useMessageReactions";
import {
    add_project_chat,
    build_optimistic_project_chat,
    mark_project_chat_deleted,
    useProjectChat,
} from "./useProjectChat";
import {
    CHAT_CONVERSATION_PREVIEWS_QUERY_KEY,
    mark_project_conversation_preview_deleted,
    update_project_conversation_preview,
} from "./useChatConversationPreviews";
import { flattenChatPages } from "./chatCache";

export function useProjectChatThread(projectId: string | undefined) {
    const queryClient = useQueryClient();
    const history = useProjectChat(projectId);
    const chats = useMemo(
        () => (history.data ? flattenChatPages(history.data.pages) : undefined),
        [history.data],
    );

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!projectId) return;
        const operationId = crypto.randomUUID();
        const sent = send_socket_message({
            type: InboundSocketMessageType.PROJECT_CHAT_CREATE,
            payload: { message, repliedToId, operationId },
        });
        if (!sent) {
            toast.error("Couldn't send your message.");
            return;
        }

        const viewer = SessionServices.get_user();
        if (!viewer?.id || !viewer.email) return;
        const repliedTo = repliedToId ? (chats?.find((c) => c.id === repliedToId) ?? null) : null;
        const optimistic_chat = build_optimistic_project_chat(
            projectId,
            operationId,
            message,
            references,
            repliedTo,
            {
                id: viewer.id,
                name: viewer.name ?? null,
                email: viewer.email,
                image: viewer.image ?? null,
            },
        );
        add_project_chat(queryClient, optimistic_chat, () => {
            queryClient.invalidateQueries({
                queryKey: [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
            });
            toast.error("Couldn't confirm your message. Try sending it again.");
        });
        update_project_conversation_preview(queryClient, projectId, optimistic_chat);
    }

    function remove(chat: ProjectChat) {
        const sent = send_socket_message({
            type: InboundSocketMessageType.PROJECT_CHAT_DELETE,
            payload: { chatId: chat.id },
        });
        if (!sent) {
            toast.error("Couldn't delete the message.");
            return;
        }
        mark_project_chat_deleted(queryClient, chat);
        if (projectId) mark_project_conversation_preview_deleted(queryClient, projectId, chat.id);
    }

    function react(chat: ProjectChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_project_chat_reaction(queryClient, chat, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    return {
        chats,
        isLoading: history.isLoading,
        isInitialError: history.isError && !history.data,
        isPageError: history.isFetchNextPageError,
        isFetchingOlder: history.isFetchingNextPage,
        hasOlder: Boolean(history.hasNextPage),
        pageCount: history.data?.pages.length ?? 0,
        fetchOlder: history.fetchNextPage,
        retry: history.refetch,
        send,
        remove,
        react,
    };
}
