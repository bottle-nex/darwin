"use client";
import { useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import PlaygroundTopBar from "@/components/playground/Core/TopBar/PlaygroundTopBar";
import PlaygroundSidebar from "@/components/playground/Sidebar/PlaygroundSidebar";
import SidebarResizeHandle from "@/components/playground/Sidebar/SidebarResizeHandle";
import PlaygroundDisplay from "@/components/playground/Core/PlaygroundDisplay";
import OnboardingDisplay from "@/components/onboarding/OnboardingDisplay";
import CreateTeamDialog from "@/components/team/CreateTeamDialog";
import DeleteTeamDialog from "@/components/team/DeleteTeamDialog";
import CreateOrEditIssueDialog from "@/components/playground/Home/KanbanDisplay/Issue/CreateOrEditIssueDialog";
import PlaygroundShortcutSheet from "@/components/playground/Sidebar/PlaygroundShortcutSheet";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
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

    useSubscribeEventHandlers(activeProject?.id);

    usePlaygroundUrlSync(project?.teams);
    useIssueDialog({ sync: true });
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
                ) : (
                    <PlaygroundDisplay isLoading={loading} />
                )}
            </section>
            <CreateTeamDialog />
            <DeleteTeamDialog />
            <CreateOrEditIssueDialog />
            <PlaygroundShortcutSheet />
        </main>
    );
}
