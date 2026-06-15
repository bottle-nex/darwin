"use client";
import { useParams } from "next/navigation";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { isProjectSettingsTab, ProjectsTab } from "../projectsTabs";
import ProjectTopbar from "./ProjectTopbar";
import ProjectsOverviewPane from "./ProjectsOverviewPane";
import GanttPane from "./GanttPane";
import ProjectSettingsView from "./ProjectSettingsView";
import TeamDetailPane from "./TeamDetailPane";

/**
 * Renders the Projects surface: a shared top bar (project + view switcher) over
 * the active view. Overview / Gantt / Settings are switched from the top bar;
 * the Settings view additionally swaps the sidebar to the per-project settings nav.
 */
export default function ProjectsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;

    // The workspace always resolves to a project; render nothing until it does.
    if (!activeProject) return <div className="flex min-h-0 flex-1" />;

    function content() {
        if (isProjectSettingsTab(tab)) return <ProjectSettingsView />;
        switch (tab) {
            case ProjectsTab.Gantt:
                return <GanttPane />;
            case ProjectsTab.TeamDetail:
                return <TeamDetailPane surface={RailSurface.Projects} />;
            case ProjectsTab.Overview:
            default:
                return <ProjectsOverviewPane />;
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ProjectTopbar project={activeProject} />
            <div className="flex min-h-0 flex-1 flex-col">{content()}</div>
        </div>
    );
}
