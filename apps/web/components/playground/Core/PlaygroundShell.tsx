"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import PlaygroundIconRail from "@/components/playground/iconrail/PlaygroundIconRail";
import { RailSurface } from "@/components/playground/iconrail/railSurface";
import { ProjectsTab } from "@/components/playground/projects/projectsTabs";
import PlaygroundTopBar from "@/components/playground/core/topbar/PlaygroundTopBar";
import PlaygroundWorkspace from "@/components/playground/core/PlaygroundWorkspace";
import CreateTeamDialog from "@/components/team/CreateTeamDialog";
import DeleteTeamDialog from "@/components/team/DeleteTeamDialog";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { usePlaygroundUrlSync } from "./usePlaygroundUrlSync";

/**
 * Shared playground workspace shell rendered by both the org route
 * (`/playground/[orgSlug]`) and the project route
 * (`/playground/[orgSlug]/[projectSlug]`). When a project slug is present it
 * resolves it to an id via the org's dashboard and fetches that project's
 * detail (teams, etc.) so it is warm in the query cache for the workspace.
 */
export default function PlaygroundShell() {
    const { orgSlug, projectSlug } = useParams<{
        orgSlug: string;
        projectSlug?: string;
    }>();

    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const surface = usePlaygroundNavStore((s) => s.surface);
    const setSurface = usePlaygroundNavStore((s) => s.setSurface);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const setProjectsSidebarMode = usePlaygroundNavStore((s) => s.setProjectsSidebarMode);

    // Tapping the Projects rail icon opens the active project's nav on its Overview.
    // The project list is reachable from that nav's "Back to projects" row.
    function selectSurface(next: RailSurface) {
        setSurface(next);
        if (next === RailSurface.Projects) {
            setProjectsSidebarMode("nav");
            setTab(RailSurface.Projects, ProjectsTab.Overview);
        }
    }

    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);

    // Keep the active surface/tab (and open team) in the URL so a refresh restores it.
    usePlaygroundUrlSync(project?.teams);

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-linear-to-br from-cement to-primary/10 text-neutral-100 pt-px select-none">
            <PlaygroundTopBar />
            <section className="flex flex-1 min-h-0 gap-2 p-2 pt-px">
                <PlaygroundIconRail
                    activeSurface={surface}
                    onSelectSurface={selectSurface}
                    sidebarCollapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                />
                <PlaygroundWorkspace
                    surface={surface}
                    sidebarCollapsed={sidebarCollapsed}
                    onCollapseSidebar={() => setSidebarCollapsed(true)}
                />
            </section>
            <CreateTeamDialog />
            <DeleteTeamDialog />
        </main>
    );
}
