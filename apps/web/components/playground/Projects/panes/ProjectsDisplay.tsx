"use client";
import { useParams } from "next/navigation";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectOverview from "./ProjectOverview";
import KanbanMainPane from "../../Home/panes/kanban/KanbanMainPane";
import GanttPane from "./GanttPane";
import ProjectSettingsView from "./ProjectSettingsView";
import TeamDetailPane from "./TeamDetailPane";

export default function ProjectsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;

    if (!activeProject) return <div className="flex min-h-0 flex-1" />;
    const project = activeProject;

    function content() {
        switch (tab) {
            case ProjectsTab.Kanban:
                return <KanbanMainPane />;
            case ProjectsTab.Gantt:
                return <GanttPane />;
            case ProjectsTab.SettingsProject:
            case ProjectsTab.SettingsTeams:
            case ProjectsTab.SettingsMembers:
            case ProjectsTab.SettingsEnv:
                return <ProjectSettingsView />;
            case ProjectsTab.TeamDetail:
                return <TeamDetailPane />;
            case ProjectsTab.Overview:
            default:
                return <ProjectOverview project={project} />;
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">{content()}</div>
        </div>
    );
}
