"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectsOverviewPane from "./ProjectsOverviewPane";
import TeamDetailPane from "./TeamDetailPane";
import GanttPane from "./GanttPane";

/** Renders the Projects surface's active tab. */
export default function ProjectsMainPane() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);

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
