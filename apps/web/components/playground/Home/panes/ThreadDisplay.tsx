"use client";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import ThreadsDisplay from "./ThreadsDisplay";
import { useThreadDetail } from "./useThreadDetail";

/**
 * The conversation opened from the Threads sidebar: the project's single
 * general chat, or one issue's comments. Falls back to the picker empty state
 * when the selected thread belongs to a different project than the one
 * currently open (e.g. after navigating away). The project/issue header now
 * lives in the shared `ChatsBreadcrumb` topbar above this pane.
 */
export default function ThreadDisplay() {
    const {
        selectedThread,
        isMatchingProject,
        activeProject,
        chats,
        isChatsLoading,
        handleSend,
        handleDelete,
        handleReaction,
    } = useThreadDetail();

    if (!selectedThread || !isMatchingProject) {
        return <ThreadsDisplay />;
    }

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
            <ProjectChatThread
                key={
                    selectedThread.kind === "project"
                        ? "project"
                        : `issue-${selectedThread.issueId}`
                }
                chats={chats}
                projectId={activeProject?.id}
                loading={isChatsLoading}
                placeholder={
                    selectedThread.kind === "project"
                        ? "Message the project..."
                        : "Leave a comment..."
                }
                emptyMessage={
                    selectedThread.kind === "project" ? "No messages yet." : "No comments yet."
                }
                onSend={handleSend}
                onDelete={handleDelete}
                onReaction={handleReaction}
            />
        </div>
    );
}
