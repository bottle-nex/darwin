"use client";
import { type IconType } from "react-icons";
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentText,
    HiOutlineKey,
    HiOutlinePencilSquare,
} from "react-icons/hi2";
import Row from "./SidebarRow";
import type { SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

type SettingsItem = { tab: PlaygroundTab; label: string; icon: IconType };

const SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsProject, label: "Project", icon: HiOutlinePencilSquare },
    { tab: PlaygroundTab.SettingsTemplates, label: "Issue templates", icon: HiOutlineDocumentText },
    { tab: PlaygroundTab.SettingsEnv, label: "Environment variables", icon: HiOutlineKey },
];

/**
 * The settings face of the sidebar, shown while a settings tab is active.
 * "Back" returns to the main nav (by committing a normal view tab); the rows
 * below select one settings section each.
 */
export default function PlaygroundSidebarSettingsNavSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    return (
        <div className="mt-1 flex flex-col gap-0.5">
            <Row
                leading={{ kind: "icon", icon: HiOutlineArrowLeft }}
                label="Back"
                onClick={() => onSelect(PlaygroundTab.Kanban)}
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
