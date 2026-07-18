"use client";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MdChat, MdFolder } from "react-icons/md";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useChats, add_chat, build_optimistic_chat } from "@/hooks/chats/useChats";
import {
    useProjectChat,
    add_project_chat,
    build_optimistic_project_chat,
} from "@/hooks/chats/useProjectChat";
import { send_socket_message } from "@/socket/singleton.socket";
import { InboundSocketMessageType } from "@trymatcha/types";
import SessionServices from "@/lib/session";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { DEFAULT_FOLDER_COLOR } from "@/components/playground/Core/TopBar/PlaygroundProjectSwitcher";
import ThreadsDisplay from "./ThreadsDisplay";

/**
 * The conversation opened from the Threads sidebar: the project's single
 * general chat, or one issue's comments. Falls back to the picker empty state
 * when the selected thread belongs to a different project than the one
 * currently open (e.g. after navigating away).
 */
export default function ThreadDetailDisplay() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const queryClient = useQueryClient();
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const selectedThreadProjectSlug = usePlaygroundNavStore((s) => s.selectedThreadProjectSlug);
    const activeProject = useActiveProject();
    const { data: members } = useProjectMembers(activeProject?.id);

    const { data: projectChats, isLoading: isProjectChatLoading } = useProjectChat(
        selectedThread?.kind === "project" ? activeProject?.id : undefined,
    );
    const { data: issueChats, isLoading: isIssueChatLoading } = useChats(
        selectedThread?.kind === "issue" ? selectedThread.issueId : undefined,
    );

    if (!selectedThread || selectedThreadProjectSlug !== projectSlug) {
        return <ThreadsDisplay />;
    }

    function handleSend(message: string, repliedToId?: string) {
        if (!selectedThread) return;
        const sent =
            selectedThread.kind === "project"
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

        // Echo the message into the local cache immediately — the real
        // broadcast (which reconciles this) can take a moment to round-trip.
        const currentUser = SessionServices.get_user();
        if (!currentUser?.id || !currentUser.email) return;
        const sender = {
            id: currentUser.id,
            name: currentUser.name ?? null,
            email: currentUser.email,
            image: currentUser.image ?? null,
        };
        if (selectedThread.kind === "project" && activeProject?.id) {
            const repliedTo = repliedToId
                ? (projectChats?.find((c) => c.id === repliedToId) ?? null)
                : null;
            add_project_chat(
                queryClient,
                build_optimistic_project_chat(activeProject.id, message, repliedTo, sender),
            );
        } else if (selectedThread.kind === "issue") {
            const repliedTo = repliedToId
                ? (issueChats?.find((c) => c.id === repliedToId) ?? null)
                : null;
            add_chat(
                queryClient,
                build_optimistic_chat(selectedThread.issueId, message, repliedTo, sender),
            );
        }
    }

    const isProjectThread = selectedThread.kind === "project";
    const title = isProjectThread
        ? (activeProject?.name ?? "Project chat")
        : `#${selectedThread.issueNumber} ${selectedThread.issueTitle}`;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/5 px-3">
                {isProjectThread ? (
                    <MdFolder
                        className="size-4 shrink-0"
                        style={{
                            color: activeProject?.color ?? DEFAULT_FOLDER_COLOR,
                            fill: activeProject?.color ?? DEFAULT_FOLDER_COLOR,
                        }}
                        aria-hidden
                    />
                ) : (
                    <MdChat className="size-4 shrink-0 text-neutral-400" aria-hidden />
                )}
                <h2 className="truncate text-[13px] font-semibold text-neutral-100">{title}</h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col *:px-4 *:py-3">
                <ProjectChatThread
                    key={
                        selectedThread.kind === "project"
                            ? "project"
                            : `issue-${selectedThread.issueId}`
                    }
                    chats={selectedThread.kind === "project" ? projectChats : issueChats}
                    members={members}
                    loading={
                        selectedThread.kind === "project"
                            ? isProjectChatLoading
                            : isIssueChatLoading
                    }
                    placeholder={
                        selectedThread.kind === "project"
                            ? "Message the project..."
                            : "Leave a comment..."
                    }
                    emptyMessage={
                        selectedThread.kind === "project" ? "No messages yet." : "No comments yet."
                    }
                    onSend={handleSend}
                />
            </div>
        </div>
    );
}
