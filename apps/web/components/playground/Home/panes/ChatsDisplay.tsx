"use client";
import {
    type ProjectChat,
    ProjectRole,
    type TeamChat,
    TeamRole,
    type ThreadMessage,
} from "@trymatcha/types";
import { useEffect, useMemo } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ChatConversationSidebar from "@/components/playground/Home/chat/ChatConversationSidebar";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { useProjectChatThread } from "@/hooks/chats/useProjectChatThread";
import { useTeamChatThread } from "@/hooks/chats/useTeamChatThread";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { useActiveProject } from "@/hooks/useActiveProject";
import SessionServices from "@/lib/session";
import { useChatThreadStore } from "@/store/playground/useChatThreadStore";

export default function ChatsDisplay() {
    const activeProject = useActiveProject();
    const { data: project } = useGetProject(activeProject?.id);
    const teamId = useChatThreadStore((state) => state.teamId);
    const selectProject = useChatThreadStore((state) => state.selectProject);
    const selectTeam = useChatThreadStore((state) => state.selectTeam);
    const teams = useMemo(
        () => project?.teams.filter((team) => team.viewerRole !== null) ?? [],
        [project?.teams],
    );
    const selectedTeam = teams.find((team) => team.id === teamId);
    const projectThread = useProjectChatThread(selectedTeam ? undefined : activeProject?.id);
    const teamThread = useTeamChatThread(selectedTeam?.id, activeProject?.id);
    const { data: teamMembers } = useGetTeamMembers(selectedTeam?.id);
    const viewerId = SessionServices.get_user()?.id;
    const memberUserIds = useMemo(
        () =>
            selectedTeam ? (teamMembers?.members.map((member) => member.user.id) ?? []) : undefined,
        [selectedTeam, teamMembers],
    );

    useEffect(() => {
        if (!project) return;
        const urlTeamId = new URLSearchParams(window.location.search).get("teamChat");
        if (urlTeamId && teams.some((team) => team.id === urlTeamId)) {
            if (teamId !== urlTeamId) selectTeam(urlTeamId);
            return;
        }
        if (urlTeamId) {
            const params = new URLSearchParams(window.location.search);
            params.delete("teamChat");
            const query = params.toString();
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${query ? `?${query}` : ""}`,
            );
        }
        if (teamId && !teams.some((team) => team.id === teamId)) selectProject();
    }, [project, selectProject, selectTeam, teamId, teams]);

    function selectConversation(nextTeamId: string | null) {
        if (nextTeamId) selectTeam(nextTeamId);
        else selectProject();
        const params = new URLSearchParams(window.location.search);
        if (nextTeamId) params.set("teamChat", nextTeamId);
        else params.delete("teamChat");
        const query = params.toString();
        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${query ? `?${query}` : ""}`,
        );
    }

    const thread = selectedTeam ? teamThread : projectThread;
    const viewerMembership = teamMembers?.members.find((member) => member.user.id === viewerId);
    const accessLost =
        Boolean(selectedTeam) &&
        (teamThread.accessDenied || Boolean(teamMembers && !viewerMembership));

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <PlaygroundBreadcrumb
                    trail={
                        selectedTeam
                            ? [
                                  { label: "Chats", onClick: () => selectConversation(null) },
                                  selectedTeam.name,
                              ]
                            : ["Chats"]
                    }
                />
            </PaneLeadSlot>
            <div className="flex min-h-0 min-w-0 flex-1 flex-row">
                <ChatConversationSidebar
                    project={
                        project
                            ? {
                                  id: project.id,
                                  name: project.name,
                                  canCreateTeam: project.viewerRole === ProjectRole.Admin,
                              }
                            : undefined
                    }
                    teams={teams}
                    selectedTeamId={selectedTeam?.id ?? null}
                    onSelect={selectConversation}
                />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
                    <ProjectChatThread
                        key={
                            selectedTeam
                                ? `team:${selectedTeam.id}`
                                : `project:${activeProject?.id}`
                        }
                        historyKey={
                            selectedTeam
                                ? `team:${selectedTeam.id}`
                                : `project:${activeProject?.id}`
                        }
                        chats={thread.chats}
                        projectId={activeProject?.id}
                        loading={thread.isLoading}
                        initialError={thread.isInitialError && !accessLost}
                        pageError={thread.isPageError}
                        fetchingOlder={thread.isFetchingOlder}
                        hasOlder={thread.hasOlder}
                        pageCount={thread.pageCount}
                        disabled={accessLost}
                        canDeleteAny={
                            selectedTeam
                                ? selectedTeam.viewerRole === TeamRole.Maintainer
                                : undefined
                        }
                        memberUserIds={memberUserIds}
                        placeholder={
                            selectedTeam
                                ? `Message ${selectedTeam.name}...`
                                : "Message the project..."
                        }
                        emptyMessage={
                            accessLost ? "You no longer have access to this team." : "Say Hi!"
                        }
                        onLoadOlder={thread.fetchOlder}
                        onRetry={thread.retry}
                        onSend={thread.send}
                        onDelete={(chat: ThreadMessage) => {
                            if (selectedTeam) teamThread.remove(chat as TeamChat);
                            else projectThread.remove(chat as ProjectChat);
                        }}
                        onReaction={(chat: ThreadMessage, emoji: string) => {
                            if (selectedTeam) teamThread.react(chat as TeamChat, emoji);
                            else projectThread.react(chat as ProjectChat, emoji);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
