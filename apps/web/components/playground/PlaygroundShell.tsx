"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import PlaygroundIconRail from "@/components/playground/PlaygroundIconRail";
import { RailSurface } from "@/components/playground/IconRail/railSurface";
import PlaygroundTopBar from "@/components/playground/PlaygroundTopBar";
import PlaygroundWorkspace from "@/components/playground/PlaygroundWorkspace";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";

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
    const [activeSurface, setActiveSurface] = useState<RailSurface>(RailSurface.Home);

    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    useGetProject(activeProject?.id);

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-[#0c0c0c] text-neutral-100 pt-px">
            <PlaygroundTopBar />
            <section className="flex flex-1 min-h-0 gap-2 p-2 pt-px">
                <PlaygroundIconRail
                    activeSurface={activeSurface}
                    onSelectSurface={setActiveSurface}
                    sidebarCollapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                />
                <PlaygroundWorkspace
                    surface={activeSurface}
                    sidebarCollapsed={sidebarCollapsed}
                    onCollapseSidebar={() => setSidebarCollapsed(true)}
                />
            </section>
        </main>
    );
}
