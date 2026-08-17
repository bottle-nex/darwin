"use client";
import { MdChat, MdFolder } from "react-icons/md";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { DEFAULT_FOLDER_COLOR } from "@/components/playground/Core/TopBar/PlaygroundProjectSwitcher";
import ThreadsDisplay from "./ThreadsDisplay";
import { useThreadDetail } from "./useThreadDetail";

/**
 * The conversation opened from the Threads sidebar: the project's single
 * general chat, or one issue's comments. Falls back to the picker empty state
 * when the selected thread belongs to a different project than the one
 * currently open (e.g. after navigating away).
 */
export default function ThreadDetailDisplay() {
    const { openIssue } = useIssueRoute();
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

    // Narrowing must happen off `selectedThread.kind` directly (not a boolean returned
    // from the hook) so TS can discriminate `issueId`/`issueNumber` access below.
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
                {isProjectThread ? (
                    <h2 className="truncate text-[13px] font-semibold text-neutral-100">{title}</h2>
                ) : (
                    <h2
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer truncate text-[13px] font-semibold text-neutral-100"
                        onClick={() => openIssue(selectedThread.issueId)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openIssue(selectedThread.issueId);
                            }
                        }}
                    >
                        {title}
                    </h2>
                )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col *:px-4 *:py-3">
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
        </div>
    );
}
