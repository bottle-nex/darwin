"use client";
import { useEffect, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import PlaygroundCollapsedLead from "@/components/playground/Core/TopBar/PlaygroundCollapsedLead";
import PlaygroundPaneFrame from "@/components/playground/Core/components/PlaygroundPaneFrame";
import PlaygroundSidebar from "@/components/playground/Sidebar/PlaygroundSidebar";
import PlaygroundSheetSidebar from "@/components/playground/Sidebar/PlaygroundSheetSidebar";
import SidebarResizeHandle from "@/components/playground/Sidebar/SidebarResizeHandle";
import PlaygroundDisplay from "@/components/playground/Core/PlaygroundDisplay";
import OnboardingDisplay from "@/components/onboarding/OnboardingDisplay";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
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
import { usePlaygroundUrlSync } from "./usePlaygroundUrlSync";
import { useSubscribeEventHandlers } from "@/hooks/socket/useSubscribeEventHandlers";
import usePlaygroundShortcuts from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import CommandMenu from "@/components/command/CommandMenu";
import CommandDialogs from "@/components/command/CommandDialogs";

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

    useSubscribeEventHandlers(activeProject?.id);

    const { mutate: setLastVisited } = useSetLastVisited();
    useEffect(() => {
        if (orgSlug && activeProject) {
            setLastVisited({ orgSlug, projectSlug: activeProject.slug });
        }
    }, [orgSlug, activeProject, setLastVisited]);

    usePlaygroundUrlSync(project?.teams);
    const { mode } = useIssueRoute({ sync: true });
    usePlaygroundShortcuts();

    const setCommandContext = useCommandContextStore((s) => s.setContext);
    useEffect(() => {
        setCommandContext({
            orgSlug: orgSlug ?? null,
            projectId: activeProject?.id ?? null,
            issueId: mode?.kind === "open" ? mode.issueId : null,
        });
    }, [orgSlug, activeProject?.id, mode, setCommandContext]);
    useLayoutEffect(() => {
        useSidebarWidthStore.persist.rehydrate();
    }, []);

    const loading = isDashboardPending || (activeProject ? isProjectPending : false);
    const showOnboarding = !loading && !!project && !project.tourCompleted;

    return (
        <main className="relative flex h-screen flex-col overflow-hidden text-neutral-100 select-none tracking-wide">
            <section className="relative flex flex-1 min-h-0 p-2">
                <PlaygroundSidebar />
                <SidebarResizeHandle />
                <PlaygroundPaneFrame lead={<PlaygroundCollapsedLead />}>
                    {showOnboarding ? (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <OnboardingDisplay project={project} orgId={dashboard!.org.id} />
                        </div>
                    ) : mode?.kind === "open" ? (
                        <IssueDisplay issueId={mode.issueId} />
                    ) : (
                        <PlaygroundDisplay isLoading={loading} />
                    )}
                </PlaygroundPaneFrame>
                <NotificationsPanel />
            </section>
            <PlaygroundSheetSidebar />
            <CreateProjectDialog />
            <CreateTeamDialog />
            <DeleteTeamDialog />
            <CreateIssueDialog />
            <PlaygroundShortcutSheet />
            <CommandMenu />
            <CommandDialogs />
            <FloatNotifications />
        </main>
    );
}
