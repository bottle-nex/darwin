"use client";
import { useQueryClient } from "@tanstack/react-query";
import {
    InboundSocketMessageType,
    ProjectRole,
    type Chat,
    type LabelledReference,
} from "@trymatcha/types";
import { toast } from "@/lib/toast";
import SessionServices from "@/lib/session";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { send_socket_message } from "@/hooks/socket/useWebSocket";
import { toggle_chat_reaction } from "./useMessageReactions";
import {
    add_chat,
    build_optimistic_chat,
    mark_chat_deleted,
    useChats,
    OPTIMISTIC_ID_PREFIX,
} from "./useChats";

export function useIssueComments(issueId: string | undefined) {
    const queryClient = useQueryClient();
    const { data: comments, isLoading } = useChats(issueId);
    const projectId = useActiveProject()?.id;
    const { data: members } = useProjectMembers(projectId);
    const viewerId = SessionServices.get_user()?.id;
    const viewerIsAdmin =
        members?.some((member) => member.id === viewerId && member.role === ProjectRole.Admin) ??
        false;

    function send(message: string, references: LabelledReference[], repliedToId?: string) {
        if (!issueId) return;
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_CREATE,
            payload: { issueId, message, repliedToId },
        });
        if (!sent) {
            toast.error("Couldn't add your comment.");
            return;
        }

        const viewer = SessionServices.get_user();
        if (!viewer?.id || !viewer.email) return;
        const repliedTo = repliedToId
            ? (comments?.find((comment) => comment.id === repliedToId) ?? null)
            : null;
        add_chat(
            queryClient,
            build_optimistic_chat(issueId, message, references, repliedTo, {
                id: viewer.id,
                name: viewer.name ?? null,
                email: viewer.email,
                image: viewer.image ?? null,
            }),
        );
    }

    function remove(comment: Chat) {
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_DELETE,
            payload: { chatId: comment.id },
        });
        if (!sent) {
            toast.error("Couldn't delete the comment.");
            return;
        }
        mark_chat_deleted(queryClient, comment);
    }

    function react(comment: Chat, emoji: string) {
        if (comment.id.startsWith(OPTIMISTIC_ID_PREFIX)) return;
        if (!toggle_chat_reaction(queryClient, comment, emoji)) {
            toast.error("Couldn't update the reaction.");
        }
    }

    function canDelete(comment: Chat) {
        return (
            Boolean(viewerId) &&
            !comment.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
            !comment.isDeleted &&
            (comment.senderId === viewerId || viewerIsAdmin)
        );
    }

    return { comments, isLoading, projectId, viewerId, send, remove, react, canDelete };
}
