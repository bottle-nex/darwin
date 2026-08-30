import type { IconType } from "@trymatcha/ui/icons";
import {
    EnvSecretIcon,
    GithubLogoIcon,
    HarnessIcon,
    SettingsApiKeysIcon,
    SettingsAppearanceIcon,
    SettingsGeneralIcon,
    SettingsTemplatesIcon,
} from "@trymatcha/ui/icons";

import { PlaygroundTab } from "../playgroundTabs";

export type SettingsItem = { tab: PlaygroundTab; label: string; icon: IconType };

const ACCOUNT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsAppearance, label: "Appearance", icon: SettingsAppearanceIcon },
    { tab: PlaygroundTab.SettingsApiKeys, label: "API keys", icon: SettingsApiKeysIcon },
];

const PROJECT_SETTINGS: SettingsItem[] = [
    { tab: PlaygroundTab.SettingsProject, label: "General", icon: SettingsGeneralIcon },
    { tab: PlaygroundTab.SettingsTemplates, label: "Issue templates", icon: SettingsTemplatesIcon },
    { tab: PlaygroundTab.SettingsEnv, label: "Environment variables", icon: EnvSecretIcon },
    { tab: PlaygroundTab.SettingsHarness, label: "AI Harness", icon: HarnessIcon },
    { tab: PlaygroundTab.SettingsIntegrations, label: "Integrations", icon: GithubLogoIcon },
];

export function filterSettingsItems(query: string, hasProject: boolean) {
    const needle = query.trim().toLowerCase();
    const matches = (item: SettingsItem) => item.label.toLowerCase().includes(needle);
    const accountItems = ACCOUNT_SETTINGS.filter(matches);
    const projectItems = hasProject ? PROJECT_SETTINGS.filter(matches) : [];

    return {
        accountItems,
        projectItems,
        topMatch: needle ? [...accountItems, ...projectItems][0] : undefined,
    };
}
