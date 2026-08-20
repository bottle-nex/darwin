"use client";
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

export function useProjectChatThread(projectId: string | undefined) {
    const queryClient = useQueryClient();
    const { data: chats, isLoading } = useProjectChat(projectId);

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!projectId) return;
        const sent = send_socket_message({
            type: InboundSocketMessageType.PROJECT_CHAT_CREATE,
            payload: { message, repliedToId },
        });
        if (!sent) {
            toast.error("Couldn't send your message.");
            return;
        }

        const viewer = SessionServices.get_user();
        if (!viewer?.id || !viewer.email) return;
        const repliedTo = repliedToId ? (chats?.find((c) => c.id === repliedToId) ?? null) : null;
        add_project_chat(
            queryClient,
            build_optimistic_project_chat(projectId, message, references, repliedTo, {
                id: viewer.id,
                name: viewer.name ?? null,
                email: viewer.email,
                image: viewer.image ?? null,
            }),
        );
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
    }

    function react(chat: ProjectChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_project_chat_reaction(queryClient, chat, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    return { chats, isLoading, send, remove, react };
}
