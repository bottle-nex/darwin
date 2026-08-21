"use client";
import { HiOutlineBell, HiOutlineInbox } from "react-icons/hi2";
import {
    TeamRole,
    type Notification,
    type ProjectChat,
    type TeamChat,
    type ThreadMessage,
} from "@trymatcha/types";
import { useMemo } from "react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import IssueDetail from "@/components/playground/Issue/IssueDetail";
import { notification_target } from "@/components/playground/Core/Notifications/notificationView";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useProjectChatThread } from "@/hooks/chats/useProjectChatThread";
import { useTeamChatThread } from "@/hooks/chats/useTeamChatThread";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import SessionServices from "@/lib/session";
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
        return <InboxChatDetail projectId={project?.id} teamId={destination.teamId} />;
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

function InboxChatDetail({
    projectId,
    teamId,
}: {
    projectId: string | undefined;
    teamId: string | undefined;
}) {
    const projectThread = useProjectChatThread(teamId ? undefined : projectId);
    const teamThread = useTeamChatThread(teamId);
    const { data: teamMembers, isError: teamMembersError } = useGetTeamMembers(teamId);
    const viewerId = SessionServices.get_user()?.id;
    const viewerMembership = teamMembers?.members.find((member) => member.user.id === viewerId);
    const memberUserIds = useMemo(
        () => (teamId ? (teamMembers?.members.map((member) => member.user.id) ?? []) : undefined),
        [teamId, teamMembers],
    );
    const thread = teamId ? teamThread : projectThread;
    const accessLost =
        Boolean(teamId) &&
        (teamThread.isError || teamMembersError || (teamMembers && !viewerMembership));

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
            <ProjectChatThread
                key={teamId ? `team:${teamId}` : `project:${projectId}`}
                chats={thread.chats}
                projectId={projectId}
                loading={thread.isLoading}
                disabled={accessLost}
                canDeleteAny={teamId ? viewerMembership?.role === TeamRole.Maintainer : undefined}
                memberUserIds={memberUserIds}
                placeholder={teamId ? "Message the team..." : "Message the project..."}
                emptyMessage={
                    accessLost ? "You no longer have access to this team." : "No messages yet."
                }
                onSend={thread.send}
                onDelete={(chat: ThreadMessage) => {
                    if (teamId) teamThread.remove(chat as TeamChat);
                    else projectThread.remove(chat as ProjectChat);
                }}
                onReaction={(chat: ThreadMessage, emoji: string) => {
                    if (teamId) teamThread.react(chat as TeamChat, emoji);
                    else projectThread.react(chat as ProjectChat, emoji);
                }}
            />
        </div>
    );
}
