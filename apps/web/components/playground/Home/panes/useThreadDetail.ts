"use client";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { LabelledReference } from "@trymatcha/types";
import {
    useChats,
    add_chat,
    build_optimistic_chat,
    mark_chat_deleted,
    OPTIMISTIC_ID_PREFIX,
} from "@/hooks/chats/useChats";
import {
    useProjectChat,
    add_project_chat,
    build_optimistic_project_chat,
    mark_project_chat_deleted,
} from "@/hooks/chats/useProjectChat";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { InboundSocketMessageType, type Chat, type ProjectChat } from "@trymatcha/types";
import SessionServices from "@/lib/session";
import {
    toggle_chat_reaction,
    toggle_project_chat_reaction,
} from "@/hooks/chats/useMessageReactions";

/**
 * Data + socket/cache logic behind the thread opened from the Threads sidebar:
 * the project's single general chat, or one issue's comments.
 */
export function useThreadDetail() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const queryClient = useQueryClient();
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const selectedThreadProjectSlug = usePlaygroundNavStore((s) => s.selectedThreadProjectSlug);
    const activeProject = useActiveProject();
    const isProjectThread = selectedThread?.kind === "project";

    const { data: projectChats, isLoading: isProjectChatLoading } = useProjectChat(
        isProjectThread ? activeProject?.id : undefined,
    );
    const { data: issueChats, isLoading: isIssueChatLoading } = useChats(
        selectedThread?.kind === "issue" ? selectedThread.issueId : undefined,
    );
    const chats = isProjectThread ? projectChats : issueChats;
    const isChatsLoading = isProjectThread ? isProjectChatLoading : isIssueChatLoading;

    const isMatchingProject = !!selectedThread && selectedThreadProjectSlug === projectSlug;

    // The real broadcast (which reconciles this) can take a moment to round-trip,
    // so we echo the sent message into the local cache right away.
    function echoSentMessage(
        message: string,
        references: LabelledReference[],
        repliedToId: string | undefined,
    ) {
        const currentUser = SessionServices.get_user();
        if (!currentUser?.id || !currentUser.email) return;
        const sender = {
            id: currentUser.id,
            name: currentUser.name ?? null,
            email: currentUser.email,
            image: currentUser.image ?? null,
        };
        const repliedTo = repliedToId ? (chats?.find((c) => c.id === repliedToId) ?? null) : null;

        if (isProjectThread && activeProject?.id) {
            add_project_chat(
                queryClient,
                build_optimistic_project_chat(
                    activeProject.id,
                    message,
                    references,
                    repliedTo as ProjectChat | null,
                    sender,
                ),
            );
        } else if (selectedThread?.kind === "issue") {
            add_chat(
                queryClient,
                build_optimistic_chat(
                    selectedThread.issueId,
                    message,
                    references,
                    repliedTo as Chat | null,
                    sender,
                ),
            );
        }
    }

    function handleSend(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!selectedThread) return;
        const sent = isProjectThread
            ? send_socket_message({
                  type: InboundSocketMessageType.PROJECT_CHAT_CREATE,
                  payload: { message, repliedToId },
              })
            : send_socket_message({
                  type: InboundSocketMessageType.CHAT_CREATE,
                  payload: { issueId: selectedThread.issueId, message, repliedToId },
              });
        if (!sent) {
            toast.error("Couldn't send your message.");
            return;
        }
        echoSentMessage(message, references, repliedToId);
    }

    function handleDelete(chat: Chat | ProjectChat) {
        if (!selectedThread) return;
        const sent = isProjectThread
            ? send_socket_message({
                  type: InboundSocketMessageType.PROJECT_CHAT_DELETE,
                  payload: { chatId: chat.id },
              })
            : send_socket_message({
                  type: InboundSocketMessageType.CHAT_DELETE,
                  payload: { chatId: chat.id },
              });
        if (!sent) {
            toast.error("Couldn't delete the message.");
            return;
        }
        if (isProjectThread) {
            mark_project_chat_deleted(queryClient, chat as ProjectChat);
        } else {
            mark_chat_deleted(queryClient, chat as Chat);
        }
    }

    function handleReaction(chat: Chat | ProjectChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        const sent = isProjectThread
            ? toggle_project_chat_reaction(queryClient, chat as ProjectChat, emoji)
            : toggle_chat_reaction(queryClient, chat as Chat, emoji);
        if (!sent) toast.error("Couldn't update the reaction.");
    }

    return {
        selectedThread,
        isMatchingProject,
        activeProject,
        chats,
        isChatsLoading,
        handleSend,
        handleDelete,
        handleReaction,
    };
}
