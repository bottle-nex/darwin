"use client";
import { Folder, GanttChart, LayoutGrid, Settings2, Share2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { isProjectSettingsTab, ProjectsTab } from "../projectsTabs";
import type { Project } from "@/types/project";

const DEFAULT_FOLDER_COLOR = "#6366f1";

// The project's top-level views. Settings points at its first section; the rest
// of the settings sections live in the sidebar once this view is active.
const VIEWS: { tab: ProjectsTab; label: string; icon: LucideIcon }[] = [
    { tab: ProjectsTab.Overview, label: "Overview", icon: LayoutGrid },
    { tab: ProjectsTab.Gantt, label: "Gantt", icon: GanttChart },
    { tab: ProjectsTab.SettingsProject, label: "Settings", icon: Settings2 },
];

/** A view tab is active when it matches the live tab — Settings covers all of its sections. */
function isViewActive(viewTab: ProjectsTab, activeTab: string) {
    return viewTab === ProjectsTab.SettingsProject
        ? isProjectSettingsTab(activeTab)
        : activeTab === viewTab;
}

/**
 * Top bar for the Projects main pane — common to every project. Shows the active
 * project and switches between its views (Overview / Gantt / Settings); selecting
 * Settings is what swaps the sidebar over to the per-project settings nav.
 */
export default function ProjectTopbar({ project }: { project: Project }) {
    const activeTab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const color = project.color ?? DEFAULT_FOLDER_COLOR;

    return (
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/5 px-3">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Folder
                        className="size-3.5 shrink-0"
                        style={{ color, fill: color }}
                        aria-hidden
                    />
                    <h2 className="max-w-48 truncate text-[14px] font-semibold text-neutral-100">
                        {project.name}
                    </h2>
                </div>
                <div className="flex items-center gap-0.5">
                    {VIEWS.map((v) => (
                        <button
                            key={v.tab}
                            type="button"
                            onClick={() => setTab(RailSurface.Projects, v.tab)}
                            className={cn(
                                "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors",
                                isViewActive(v.tab, activeTab)
                                    ? "bg-white/10 text-neutral-100"
                                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                            )}
                        >
                            <v.icon className="size-3.5" aria-hidden />
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
            >
                <Share2 className="size-3.5" aria-hidden />
                Share
            </button>
        </header>
    );
}
