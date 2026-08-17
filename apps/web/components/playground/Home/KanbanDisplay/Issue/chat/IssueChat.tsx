"use client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BsChatRightTextFill } from "react-icons/bs";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
    useChats,
    add_chat,
    build_optimistic_chat,
    mark_chat_deleted,
    OPTIMISTIC_ID_PREFIX,
} from "@/hooks/chats/useChats";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import {
    InboundSocketMessageType,
    type Chat,
    type LabelledReference,
    type ProjectChat,
} from "@trymatcha/types";
import SessionServices from "@/lib/session";
import ChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { toggle_chat_reaction } from "@/hooks/chats/useMessageReactions";

/** The "Comments and activity" panel for an issue. Disabled until the issue is saved. */
export default function IssueChat({ issueId }: { issueId?: string }) {
    const queryClient = useQueryClient();
    const { data: chats, isLoading } = useChats(issueId);
    const projectId = useActiveProject()?.id;

    /**
     * Asks the server to soft-delete the comment, flagging it locally right
     * away — the CHAT_DELETED broadcast reconciles it when it round-trips
     * (CHAT_ERROR surfaces via toast).
     */
    function handleDelete(chat: Chat | ProjectChat) {
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_DELETE,
            payload: { chatId: chat.id },
        });
        if (!sent) {
            toast.error("Couldn't delete the message.");
            return;
        }
        mark_chat_deleted(queryClient, chat as Chat);
    }

    /**
     * Sends the comment over the project socket, then echoes it into the
     * local cache right away — the CHAT_CREATED broadcast reconciles it when
     * it round-trips (CHAT_ERROR surfaces via toast).
     */
    function handleSend(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!issueId) return;
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_CREATE,
            payload: { issueId, message, repliedToId },
        });
        if (!sent) {
            toast.error("Couldn't add your comment.");
            return;
        }

        const currentUser = SessionServices.get_user();
        if (!currentUser?.id || !currentUser.email) return;
        const repliedTo = repliedToId ? (chats?.find((c) => c.id === repliedToId) ?? null) : null;
        add_chat(
            queryClient,
            build_optimistic_chat(issueId, message, references, repliedTo, {
                id: currentUser.id,
                name: currentUser.name ?? null,
                email: currentUser.email,
                image: currentUser.image ?? null,
            }),
        );
    }

    function handleReaction(chat: Chat | ProjectChat, emoji: string) {
        if (chat.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_chat_reaction(queryClient, chat as Chat, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    return (
        <section className="m-2.5 flex min-h-0 min-w-0 flex-1 flex-col rounded-[8px] bg-cement *:px-4 *:py-3">
            <header className="text-sm font-medium text-neutral-100 flex items-center gap-x-3">
                <BsChatRightTextFill />
                <span>Comments and activity</span>
            </header>
            <ChatThread
                key={issueId ?? "unsaved"}
                chats={chats}
                projectId={projectId}
                loading={isLoading}
                emptyMessage={
                    issueId ? "No comments yet." : "Save the issue to start the conversation."
                }
                disabled={!issueId}
                onSend={handleSend}
                onDelete={handleDelete}
                onReaction={handleReaction}
            />
        </section>
    );
}
