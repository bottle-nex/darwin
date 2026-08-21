"use client";
import { useQueryClient } from "@tanstack/react-query";
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

export function useTeamChatThread(teamId: string | undefined) {
    const queryClient = useQueryClient();
    const { data: chats, isLoading, isError } = useTeamChat(teamId);

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!teamId) return;
        const sent = send_socket_message({
            type: InboundSocketMessageType.TEAM_CHAT_CREATE,
            payload: { teamId, message, repliedToId },
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
        add_team_chat(
            queryClient,
            build_optimistic_team_chat(teamId, message, references, repliedTo, {
                id: viewer.id,
                name: viewer.name ?? null,
                email: viewer.email,
                image: viewer.image ?? null,
            }),
        );
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
    }

    function react(chat: TeamChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_team_chat_reaction(queryClient, chat, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    return { chats, isLoading, isError, send, remove, react };
}
