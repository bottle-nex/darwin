"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import TeamDetailPane from "./TeamDetailPane";
import ProjectSettingsView from "./ProjectSettingsView";

/**
 * Renders the Projects surface: the active tab's pane. The project settings/detail
 * view opens by tapping a project in the sidebar; the default view is intentionally
 * blank for now (the Gantt timeline lives in ./GanttPane and can be wired back in
 * later).
 */
export default function ProjectsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);

    function content() {
        switch (tab) {
            case ProjectsTab.Settings:
                return <ProjectSettingsView />;
            case ProjectsTab.TeamDetail:
                return <TeamDetailPane surface={RailSurface.Projects} />;
            default:
                return <div className="flex-1" />;
        }
    }

    return <div className="flex min-h-0 flex-1 flex-col">{content()}</div>;
}
