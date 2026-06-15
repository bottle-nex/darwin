"use client";
import { ArrowLeft, BriefcaseBusiness, KeyRound, Pencil, Users, UsersRound, type LucideIcon } from "lucide-react";
import Row from "../../Sidebar/SidebarRow";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import { ProjectsTab } from "../projectsTabs";

const NAV: { tab: ProjectsTab; label: string; icon: LucideIcon; dividerBefore?: boolean }[] = [
    { tab: ProjectsTab.SettingsProject, label: "Project", icon: Pencil },
    { tab: ProjectsTab.SettingsTeams, label: "Teams", icon: BriefcaseBusiness },
    { tab: ProjectsTab.SettingsMembers, label: "Members", icon: Users },
    {
        tab: ProjectsTab.SettingsEnv,
        label: "Environment variables",
        icon: KeyRound,
        dividerBefore: true,
    },
];

/**
 * Settings-mode sidebar for the Projects surface: a Back row that returns to the
 * project list, then the per-project settings sections. The active section is the
 * committed Projects tab (`selectedRowId`), so the sidebar, the main pane, and the
 * URL all stay in sync.
 */
export default function ProjectSettingsNav({ selectedRowId, onSelect }: SidebarSectionProps) {
    return (
        <div className="mt-1 flex flex-col gap-0.5">
            <Row
                leading={{ kind: "icon", icon: ArrowLeft }}
                label="Back"
                onClick={() => onSelect(ProjectsTab.Overview)}
            />
            <div />

            {NAV.map((item) => (
                <div key={item.tab}>
                    {item.dividerBefore && <div className="my-1.5 h-px bg-white/5" />}
                    <Row
                        leading={{ kind: "icon", icon: item.icon }}
                        label={item.label}
                        active={selectedRowId === item.tab}
                        onClick={() => onSelect(item.tab)}
                    />
                </div>
            ))}
        </div>
    );
}
