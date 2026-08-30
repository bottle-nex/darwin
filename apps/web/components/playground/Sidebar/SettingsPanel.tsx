"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    EnvSecretIcon,
    GithubLogoIcon,
    SettingsApiKeysIcon,
    SettingsAppearanceIcon,
    SettingsBackIcon,
    SettingsGeneralIcon,
    SettingsTemplatesIcon,
} from "@trymatcha/ui/icons";

import { useActiveProject } from "@/hooks/useActiveProject";

import { PlaygroundTab } from "../playgroundTabs";
import type { SidebarSectionProps } from "./shared";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

type SettingsItem = { tab: PlaygroundTab; label: string; icon: IconType };

const ACCOUNT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsAppearance, label: "Appearance", icon: SettingsAppearanceIcon },
    { tab: PlaygroundTab.SettingsApiKeys, label: "API keys", icon: SettingsApiKeysIcon },
];

const PROJECT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsProject, label: "General", icon: SettingsGeneralIcon },
    { tab: PlaygroundTab.SettingsTemplates, label: "Issue templates", icon: SettingsTemplatesIcon },
    { tab: PlaygroundTab.SettingsEnv, label: "Environment variables", icon: EnvSecretIcon },
    { tab: PlaygroundTab.SettingsIntegrations, label: "Integrations", icon: GithubLogoIcon },
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
                    leading={{ kind: "icon", icon: SettingsBackIcon }}
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
