"use client";
import { useEffect, useMemo } from "react";
import { TeamRole, type ProjectChat, type TeamChat, type ThreadMessage } from "@trymatcha/types";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectChatThread } from "@/hooks/chats/useProjectChatThread";
import { useTeamChatThread } from "@/hooks/chats/useTeamChatThread";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import SessionServices from "@/lib/session";
import { useChatThreadStore } from "@/store/playground/useChatThreadStore";
import ChatsBreadcrumb from "./ChatsBreadcrumb";

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
    const teamThread = useTeamChatThread(selectedTeam?.id);
    const { data: teamMembers, isError: teamMembersError } = useGetTeamMembers(selectedTeam?.id);
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
        (teamThread.isError || teamMembersError || (teamMembers && !viewerMembership));

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <ChatsBreadcrumb
                    project={activeProject}
                    teams={teams}
                    selectedTeamId={selectedTeam?.id ?? null}
                    onSelect={selectConversation}
                />
            </PaneLeadSlot>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
                <ProjectChatThread
                    key={selectedTeam ? `team:${selectedTeam.id}` : `project:${activeProject?.id}`}
                    chats={thread.chats}
                    projectId={activeProject?.id}
                    loading={thread.isLoading}
                    disabled={accessLost}
                    canDeleteAny={
                        selectedTeam ? selectedTeam.viewerRole === TeamRole.Maintainer : undefined
                    }
                    memberUserIds={memberUserIds}
                    placeholder={
                        selectedTeam ? `Message ${selectedTeam.name}...` : "Message the project..."
                    }
                    emptyMessage={
                        accessLost ? "You no longer have access to this team." : "No messages yet."
                    }
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
    );
}
