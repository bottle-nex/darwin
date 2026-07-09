"use client";
import { type IconType } from "react-icons";
import {
    MdArrowBack,
    MdBusinessCenter,
    MdEdit,
    MdGroup,
    MdViewKanban,
    MdViewTimeline,
    MdVpnKey,
    MdWindow,
} from "react-icons/md";
import Row from "../../Sidebar/SidebarRow";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PROJECT_TAB_LABELS, ProjectsTab } from "../projectsTabs";
import ProjectTeamsNavItem from "./ProjectTeamsNavItem";

type NavItem = { tab: ProjectsTab; icon: IconType };

// The project's views, then its settings sections — split by a divider in render.
const VIEWS: NavItem[] = [
    { tab: ProjectsTab.Overview, icon: MdWindow },
    { tab: ProjectsTab.Kanban, icon: MdViewKanban },
    { tab: ProjectsTab.Gantt, icon: MdViewTimeline },
];

const SETTINGS: NavItem[] = [
    { tab: ProjectsTab.SettingsProject, icon: MdEdit },
    { tab: ProjectsTab.SettingsTeams, icon: MdBusinessCenter },
    { tab: ProjectsTab.SettingsMembers, icon: MdGroup },
    { tab: ProjectsTab.SettingsEnv, icon: MdVpnKey },
];

/**
 * A single project's sidebar nav — its views (Overview / Kanban / Gantt) and
 * settings sections. The active item is the committed Projects tab; "Back to
 * projects" returns the sidebar to the project list.
 */
export default function ProjectNav({ selectedRowId, onSelect }: SidebarSectionProps) {
    const showProjectList = usePlaygroundNavStore((s) => s.setProjectsSidebarMode);

    const renderItem = (item: NavItem) => (
        <Row
            key={item.tab}
            leading={{ kind: "icon", icon: item.icon }}
            label={PROJECT_TAB_LABELS[item.tab]}
            active={selectedRowId === item.tab}
            onClick={() => onSelect(item.tab)}
        />
    );

    return (
        <div className="mt-1 flex flex-col gap-0.5">
            <Row
                leading={{ kind: "icon", icon: MdArrowBack }}
                label="Back to projects"
                onClick={() => showProjectList("list")}
            />
            <div className="my-1.5 h-px bg-white/5" />
            {VIEWS.map(renderItem)}
            <div className="my-1.5 h-px bg-white/5" />
            {SETTINGS.map((item) =>
                item.tab === ProjectsTab.SettingsTeams ? (
                    <ProjectTeamsNavItem
                        key={item.tab}
                        selectedRowId={selectedRowId}
                        onSelect={onSelect}
                    />
                ) : (
                    renderItem(item)
                ),
            )}
        </div>
    );
}
