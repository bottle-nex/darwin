"use client";
import { type IconType } from "react-icons";
import {
    HiOutlineArrowLeft,
    HiOutlineDocumentText,
    HiOutlineKey,
    HiOutlinePaintBrush,
    HiOutlinePencilSquare,
    HiOutlineSquare3Stack3D,
} from "react-icons/hi2";
import { useActiveProject } from "@/hooks/useActiveProject";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import type { SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

type SettingsItem = { tab: PlaygroundTab; label: string; icon: IconType };

const ACCOUNT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsAppearance, label: "Appearance", icon: HiOutlinePaintBrush },
    { tab: PlaygroundTab.SettingsApiKeys, label: "API keys", icon: HiOutlineSquare3Stack3D },
];

const PROJECT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsProject, label: "General", icon: HiOutlinePencilSquare },
    { tab: PlaygroundTab.SettingsTemplates, label: "Issue templates", icon: HiOutlineDocumentText },
    { tab: PlaygroundTab.SettingsEnv, label: "Environment variables", icon: HiOutlineKey },
];

export default function PlaygroundSidebarSettingsPanel({
    selectedRowId,
    onSelect,
    onBack,
}: SidebarSectionProps & { onBack: () => void }) {
    const activeProject = useActiveProject();

    function renderItem(item: SettingsItem) {
        return (
            <Row
                key={item.tab}
                leading={{ kind: "icon", icon: item.icon }}
                label={item.label}
                active={selectedRowId === item.tab}
                onClick={() => onSelect(item.tab)}
            />
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <Row
                    leading={{ kind: "icon", icon: HiOutlineArrowLeft }}
                    label="Back"
                    onClick={onBack}
                />
                <div className="h-px bg-white/5" />
            </div>

            <Section title="Account">{ACCOUNT_SETTINGS.map(renderItem)}</Section>

            {activeProject && <Section title="Project">{PROJECT_SETTINGS.map(renderItem)}</Section>}
        </div>
    );
}
