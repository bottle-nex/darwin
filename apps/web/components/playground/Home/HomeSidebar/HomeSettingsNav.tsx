"use client";
import { type IconType } from "react-icons";
import { MdArrowBack, MdDescription, MdEdit, MdVpnKey } from "react-icons/md";
import Row from "../../Sidebar/SidebarRow";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import { HomeTab } from "../homeTabs";

type SettingsItem = { tab: HomeTab; label: string; icon: IconType };

const SETTINGS: SettingsItem[] = [
    { tab: HomeTab.SettingsProject, label: "Project", icon: MdEdit },
    { tab: HomeTab.SettingsTemplates, label: "Issue templates", icon: MdDescription },
    { tab: HomeTab.SettingsEnv, label: "Environment variables", icon: MdVpnKey },
];

/**
 * The settings face of the Home sidebar, shown while a settings tab is active.
 * "Back" returns to the main Home nav (by committing a normal view tab); the
 * rows below select one settings section each.
 */
export default function HomeSettingsNav({ selectedRowId, onSelect }: SidebarSectionProps) {
    return (
        <div className="mt-1 flex flex-col gap-0.5">
            <Row
                leading={{ kind: "icon", icon: MdArrowBack }}
                label="Back"
                onClick={() => onSelect(HomeTab.Kanban)}
            />
            <div className="my-1.5 h-px bg-white/5" />
            {SETTINGS.map((item) => (
                <Row
                    key={item.tab}
                    leading={{ kind: "icon", icon: item.icon }}
                    label={item.label}
                    active={selectedRowId === item.tab}
                    onClick={() => onSelect(item.tab)}
                />
            ))}
        </div>
    );
}
