"use client";
import { useParams } from "next/navigation";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectOverviewDisplay from "./ProjectOverviewDisplay";
import KanbanMainPane from "../../Home/KanbanDisplay/KanbanMainPane";
import GanttPane from "../../Home/GanttDisplay/GanttPane";
import ProjectSettingsView from "../../Home/SettingsDisplay/ProjectSettingsView";
import TeamDetailDisplay from "./TeamDetailDisplay";

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
                return <TeamDetailDisplay />;
            case ProjectsTab.Overview:
            default:
                return <ProjectOverviewDisplay project={project} />;
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">{content()}</div>
        </div>
    );
}
