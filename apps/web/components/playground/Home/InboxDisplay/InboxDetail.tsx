"use client";
import { HiOutlineBell, HiOutlineInbox } from "react-icons/hi2";
import type { Chat, Notification, ProjectChat } from "@trymatcha/types";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import IssueDetail from "@/components/playground/Issue/IssueDetail";
import { notification_target } from "@/components/playground/Core/Notifications/notificationView";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useProjectChatThread } from "@/hooks/chats/useProjectChatThread";
import { useInboxStore } from "@/store/playground/useInboxStore";

export default function InboxDetail({ notification }: { notification: Notification | null }) {
    const project = useActiveProject();
    const { data: board } = useBoard(project?.id);
    const clearSelection = useInboxStore((state) => state.select);

    if (!notification) {
        return (
            <PaneEmptyState
                icon={HiOutlineInbox}
                title="No notification selected"
                subtitle="Pick a notification to read it here."
            />
        );
    }

    const destination = notification_target(notification)?.destination;

    if (destination?.kind === "chats") {
        return <InboxChatDetail projectId={project?.id} />;
    }

    if (destination?.kind === "issue") {
        const issue = board?.issues.find((i) => i.id === destination.issueId);
        if (!board) return null;
        if (!issue) {
            return (
                <PaneEmptyState
                    icon={HiOutlineBell}
                    title="This issue no longer exists"
                    subtitle="It was deleted after the notification was sent."
                />
            );
        }
        return (
            <IssueDetail
                key={issue.id}
                issue={issue}
                columns={board.columns}
                embedded
                onDismiss={() => clearSelection(null)}
            />
        );
    }

    return (
        <PaneEmptyState
            icon={HiOutlineBell}
            title="Nothing to open"
            subtitle="This update doesn't link to an issue or a conversation."
        />
    );
}

function InboxChatDetail({ projectId }: { projectId: string | undefined }) {
    const { chats, isLoading, send, remove, react } = useProjectChatThread(projectId);

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
            <ProjectChatThread
                key={projectId ?? "none"}
                chats={chats}
                projectId={projectId}
                loading={isLoading}
                placeholder="Message the project..."
                emptyMessage="No messages yet."
                onSend={send}
                onDelete={(chat: Chat | ProjectChat) => remove(chat as ProjectChat)}
                onReaction={(chat: Chat | ProjectChat, emoji: string) =>
                    react(chat as ProjectChat, emoji)
                }
            />
        </div>
    );
}
