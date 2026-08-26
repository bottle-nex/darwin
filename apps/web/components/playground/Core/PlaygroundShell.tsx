"use client";
import { useParams } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import CommandDialogs from "@/components/command/CommandDialogs";
import CommandMenu from "@/components/command/CommandMenu";
import OnboardingDisplay from "@/components/onboarding/OnboardingDisplay";
import IssueSelectionBar from "@/components/playground/Core/components/IssueSelectionBar";
import PlaygroundPaneFrame from "@/components/playground/Core/components/PlaygroundPaneFrame";
import FloatNotifications from "@/components/playground/Core/Notifications/FloatNotifications";
import NotificationsPanel from "@/components/playground/Core/Notifications/NotificationsPanel";
import PlaygroundDisplay from "@/components/playground/Core/PlaygroundDisplay";
import PlaygroundCollapsedLead from "@/components/playground/Core/TopBar/PlaygroundCollapsedLead";
import CreateIssueDialog from "@/components/playground/Issue/CreateIssueDialog";
import IssueDisplay from "@/components/playground/Issue/IssueDisplay";
import { defaultHomeViewToTab, isSettingsTab } from "@/components/playground/playgroundTabs";
import ReviewDisplay from "@/components/playground/Review/ReviewDisplay";
import PlaygroundSheetSidebar from "@/components/playground/Sidebar/PlaygroundSheetSidebar";
import PlaygroundShortcutSheet from "@/components/playground/Sidebar/PlaygroundShortcutSheet";
import PlaygroundSidebar from "@/components/playground/Sidebar/PlaygroundSidebar";
import SidebarResizeHandle from "@/components/playground/Sidebar/SidebarResizeHandle";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import CreateTeamDialog from "@/components/team/CreateTeamDialog";
import DeleteTeamDialog from "@/components/team/DeleteTeamDialog";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { usePaneRoute } from "@/hooks/playground/usePaneRoute";
import { useGetProject } from "@/hooks/project/useGetProject";
import usePlaygroundShortcuts from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useSubscribeEventHandlers } from "@/hooks/socket/useSubscribeEventHandlers";
import { useSetLastVisited } from "@/hooks/user/useSetLastVisited";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

import BackgroundLighting from "./BackgroundLighting";
import { usePlaygroundUrlSync } from "./usePlaygroundUrlSync";

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

    const activeTab = usePlaygroundNavStore((s) => s.tab);
    const defaultHomeView = dashboard
        ? defaultHomeViewToTab(dashboard.userConfig.defaultHomeView)
        : undefined;
    usePlaygroundUrlSync(project?.teams, defaultHomeView);
    const paneRoute = usePaneRoute({ sync: true });
    const openIssueId = paneRoute.kind === "issue" ? paneRoute.issueId : null;
    usePlaygroundShortcuts();

    const setCommandContext = useCommandContextStore((s) => s.setContext);
    useEffect(() => {
        setCommandContext({
            orgSlug: orgSlug ?? null,
            projectId: activeProject?.id ?? null,
            issueId: openIssueId,
        });
    }, [orgSlug, activeProject?.id, openIssueId, setCommandContext]);
    useLayoutEffect(() => {
        useSidebarWidthStore.persist.rehydrate();
        useBackgroundLightingStore.persist.rehydrate();
    }, []);

    const loading = isDashboardPending || (activeProject ? isProjectPending : false);
    const inSettings = isSettingsTab(activeTab);
    const showOnboarding = !loading && !!project && !project.tourCompleted && !inSettings;

    return (
        <main className="relative flex h-screen flex-col overflow-hidden bg-ink text-neutral-100 select-none tracking-wide">
            <section className="relative flex flex-1 min-h-0 p-1.5">
                <BackgroundLighting />
                <PlaygroundSidebar />
                <SidebarResizeHandle />
                <PlaygroundPaneFrame lead={<PlaygroundCollapsedLead />}>
                    {showOnboarding ? (
                        <div className="flex min-h-0 flex-1 flex-col">
                            <OnboardingDisplay project={project} orgId={dashboard!.org.id} />
                        </div>
                    ) : paneRoute.kind === "review" ? (
                        <ReviewDisplay route={paneRoute} />
                    ) : openIssueId ? (
                        <IssueDisplay issueId={openIssueId} />
                    ) : (
                        <PlaygroundDisplay isLoading={loading} />
                    )}
                </PlaygroundPaneFrame>
                <NotificationsPanel />
                <IssueSelectionBar />
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
