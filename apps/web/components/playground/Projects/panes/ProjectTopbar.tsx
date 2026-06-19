"use client";
import { Folder } from "lucide-react";
import type { Project } from "@/types/project";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import PaneBreadcrumb from "../../core/components/PaneBreadcrumb";
import { RailSurface } from "../../iconrail/railSurface";
import { PROJECT_TAB_LABELS, ProjectsTab } from "../projectsTabs";

const DEFAULT_FOLDER_COLOR = "#6366f1";

/**
 * Top of the Projects main pane — a breadcrumb of the active project and view
 * (e.g. "another one › Kanban"). The project crumb returns to the project list.
 */
export default function ProjectTopbar({ project }: { project: Project }) {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]) as ProjectsTab;
    const showProjectList = usePlaygroundNavStore((s) => s.setProjectsSidebarMode);
    const color = project.color ?? DEFAULT_FOLDER_COLOR;
    const viewLabel = PROJECT_TAB_LABELS[tab] ?? PROJECT_TAB_LABELS[ProjectsTab.Overview];

    return (
        <PaneBreadcrumb
            leading={
                <Folder className="size-3.5 shrink-0" style={{ color, fill: color }} aria-hidden />
            }
            segments={[
                { label: project.name, onClick: () => showProjectList("list") },
                { label: viewLabel },
            ]}
        />
    );
}
