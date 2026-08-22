"use client";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { InboundSocketMessageType, type LabelledReference, type TeamChat } from "@trymatcha/types";
import { toast } from "@/lib/toast";
import SessionServices from "@/lib/session";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { OPTIMISTIC_ID_PREFIX } from "./useChats";
import { toggle_team_chat_reaction } from "./useMessageReactions";
import {
    add_team_chat,
    build_optimistic_team_chat,
    mark_team_chat_deleted,
    useTeamChat,
} from "./useTeamChat";
import {
    CHAT_CONVERSATION_PREVIEWS_QUERY_KEY,
    mark_team_conversation_preview_deleted,
    update_team_conversation_preview,
} from "./useChatConversationPreviews";
import { flattenChatPages } from "./chatCache";

export function useTeamChatThread(teamId: string | undefined, projectId?: string) {
    const queryClient = useQueryClient();
    const history = useTeamChat(teamId);
    const chats = useMemo(
        () => (history.data ? flattenChatPages(history.data.pages) : undefined),
        [history.data],
    );

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!teamId) return;
        const operationId = crypto.randomUUID();
        const sent = send_socket_message({
            type: InboundSocketMessageType.TEAM_CHAT_CREATE,
            payload: { teamId, message, repliedToId, operationId },
        });
        if (!sent) {
            toast.error("Couldn't send your message.");
            return;
        }

        const viewer = SessionServices.get_user();
        if (!viewer?.id || !viewer.email) return;
        const repliedTo = repliedToId
            ? (chats?.find((chat) => chat.id === repliedToId) ?? null)
            : null;
        const optimistic_chat = build_optimistic_team_chat(
            teamId,
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
        add_team_chat(queryClient, optimistic_chat, projectId, () => {
            if (projectId) {
                queryClient.invalidateQueries({
                    queryKey: [...CHAT_CONVERSATION_PREVIEWS_QUERY_KEY, projectId],
                });
            }
            toast.error("Couldn't confirm your message. Try sending it again.");
        });
        if (projectId) update_team_conversation_preview(queryClient, projectId, optimistic_chat);
    }

    function remove(chat: TeamChat) {
        const sent = send_socket_message({
            type: InboundSocketMessageType.TEAM_CHAT_DELETE,
            payload: { chatId: chat.id },
        });
        if (!sent) {
            toast.error("Couldn't delete the message.");
            return;
        }
        mark_team_chat_deleted(queryClient, chat);
        if (projectId) mark_team_conversation_preview_deleted(queryClient, projectId, chat);
    }

    function react(chat: TeamChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_team_chat_reaction(queryClient, chat, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    const accessDenied =
        isAxiosError(history.error) &&
        (history.error.response?.status === 401 ||
            history.error.response?.data?.error?.code === "NOT_AUTHORIZED");

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
        accessDenied,
        send,
        remove,
        react,
    };
}
