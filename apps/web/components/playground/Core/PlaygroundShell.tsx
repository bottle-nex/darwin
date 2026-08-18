"use client";
import { useEffect, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import PlaygroundTopBar from "@/components/playground/Core/TopBar/PlaygroundTopBar";
import PlaygroundSidebar from "@/components/playground/Sidebar/PlaygroundSidebar";
import PlaygroundSheetSidebar from "@/components/playground/Sidebar/PlaygroundSheetSidebar";
import SidebarResizeHandle from "@/components/playground/Sidebar/SidebarResizeHandle";
import PlaygroundDisplay from "@/components/playground/Core/PlaygroundDisplay";
import OnboardingDisplay from "@/components/onboarding/OnboardingDisplay";
import CreateTeamDialog from "@/components/team/CreateTeamDialog";
import DeleteTeamDialog from "@/components/team/DeleteTeamDialog";
import CreateIssueDialog from "@/components/playground/Issue/CreateIssueDialog";
import IssueDisplay from "@/components/playground/Issue/IssueDisplay";
import PlaygroundShortcutSheet from "@/components/playground/Sidebar/PlaygroundShortcutSheet";
import NotificationsPanel from "@/components/playground/Core/Notifications/NotificationsPanel";
import FloatNotifications from "@/components/playground/Core/Notifications/FloatNotifications";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useSetLastVisited } from "@/hooks/user/useSetLastVisited";
import { useIssueThreads } from "@/hooks/chats/useIssueThreads";
import { usePlaygroundUrlSync } from "./usePlaygroundUrlSync";
import { useSubscribeEventHandlers } from "@/hooks/socket/useSubscribeEventHandlers";
import usePlaygroundShortcuts from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

export default function PlaygroundShell() {
    const { orgSlug, projectSlug } = useParams<{
        orgSlug: string;
        projectSlug?: string;
    }>();

    const { data: dashboard, isPending: isDashboardPending } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project, isPending: isProjectPending } = useGetProject(activeProject?.id);
    const { data: issueThreads } = useIssueThreads(activeProject?.id);

    useSubscribeEventHandlers(activeProject?.id);

    const { mutate: setLastVisited } = useSetLastVisited();
    useEffect(() => {
        if (orgSlug && activeProject) {
            setLastVisited({ orgSlug, projectSlug: activeProject.slug });
        }
    }, [orgSlug, activeProject, setLastVisited]);

    usePlaygroundUrlSync(project?.teams, issueThreads);
    const { mode } = useIssueRoute({ sync: true });
    usePlaygroundShortcuts();
    useLayoutEffect(() => {
        useSidebarWidthStore.persist.rehydrate();
    }, []);

    const loading = isDashboardPending || (activeProject ? isProjectPending : false);
    const showOnboarding = !loading && !!project && !project.tourCompleted;

    return (
        <main className="flex h-screen flex-col overflow-hidden text-neutral-100 pt-px select-none">
            <PlaygroundTopBar />
            <section className="flex flex-1 min-h-0 p-2 pt-px">
                <PlaygroundSidebar />
                <SidebarResizeHandle />
                {showOnboarding ? (
                    <OnboardingDisplay project={project} orgId={dashboard!.org.id} />
                ) : mode?.kind === "open" ? (
                    <IssueDisplay issueId={mode.issueId} />
                ) : (
                    <PlaygroundDisplay isLoading={loading} />
                )}
                <NotificationsPanel />
            </section>
            <PlaygroundSheetSidebar />
            <CreateTeamDialog />
            <DeleteTeamDialog />
            <CreateIssueDialog />
            <PlaygroundShortcutSheet />
            <FloatNotifications />
        </main>
    );
}
