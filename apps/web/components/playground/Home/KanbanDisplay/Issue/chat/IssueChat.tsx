"use client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BsChatRightTextFill } from "react-icons/bs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useChats, add_chat, build_optimistic_chat } from "@/hooks/chats/useChats";
import { send_socket_message } from "@/socket/singleton.socket";
import { InboundSocketMessageType } from "@trymatcha/types";
import SessionServices from "@/lib/session";
import ChatThread from "@/components/playground/Home/chat/ProjectChatThread";

/** The "Comments and activity" panel for an issue. Disabled until the issue is saved. */
export default function IssueChat({ issueId }: { issueId?: string }) {
    const queryClient = useQueryClient();
    const { data: chats, isLoading } = useChats(issueId);
    const { data: members } = useProjectMembers(useActiveProject()?.id);

    /**
     * Sends the comment over the project socket, then echoes it into the
     * local cache right away — the CHAT_CREATED broadcast reconciles it when
     * it round-trips (CHAT_ERROR surfaces via toast).
     */
    function handleSend(message: string, repliedToId?: string) {
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
            build_optimistic_chat(issueId, message, repliedTo, {
                id: currentUser.id,
                name: currentUser.name ?? null,
                email: currentUser.email,
                image: currentUser.image ?? null,
            }),
        );
    }

    return (
        <section className="m-2.5 flex min-h-0 min-w-0 flex-1 flex-col rounded-[13px] bg-white/3 *:px-4 *:py-3">
            <header className="text-sm font-medium text-neutral-100 flex items-center gap-x-3">
                <BsChatRightTextFill />
                <span>Comments and activity</span>
            </header>
            <ChatThread
                key={issueId ?? "unsaved"}
                chats={chats}
                members={members}
                loading={isLoading}
                emptyMessage={
                    issueId ? "No comments yet." : "Save the issue to start the conversation."
                }
                disabled={!issueId}
                onSend={handleSend}
            />
        </section>
    );
}
