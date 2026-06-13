"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectsTopbar from "./ProjectsTopbar";
import TeamDetailPane from "./TeamDetailPane";
import ProjectSettingsView from "./ProjectSettingsView";

/**
 * Renders the Projects surface: a persistent topbar plus the active tab's pane.
 * The default project view is intentionally blank for now (the Gantt timeline
 * lives in ./GanttPane and can be wired back in later).
 */
export default function ProjectsMainPane() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const settingsOpen = tab === ProjectsTab.Settings;

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

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ProjectsTopbar
                settingsOpen={settingsOpen}
                onToggleSettings={() =>
                    setTab(
                        RailSurface.Projects,
                        settingsOpen ? ProjectsTab.Overview : ProjectsTab.Settings,
                    )
                }
            />
            <div className="flex min-h-0 flex-1 flex-col">{content()}</div>
        </div>
    );
}
