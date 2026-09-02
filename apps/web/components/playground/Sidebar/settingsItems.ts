import type { IconType } from "@trymatcha/ui/icons";
import {
    EnvSecretIcon,
    HarnessIcon,
    SettingsApiKeysIcon,
    SettingsAppearanceIcon,
    SettingsConnectorsIcon,
    SettingsGeneralIcon,
    SettingsIntegrationsIcon,
    SettingsTemplatesIcon,
} from "@trymatcha/ui/icons";

import { PlaygroundTab } from "../playgroundTabs";

export type SettingsItem = {
    tab: PlaygroundTab;
    label: string;
    description: string;
    icon: IconType;
    facets: string[];
};

export const ACCOUNT_SETTINGS: SettingsItem[] = [
    {
        tab: PlaygroundTab.SettingsAppearance,
        label: "Appearance",
        description: "Lighting, code theme, and home view.",
        icon: SettingsAppearanceIcon,
        facets: [
            "Default home view",
            "Background lighting",
            "Glow color",
            "Direction",
            "Code theme",
            "Syntax highlighting",
        ],
    },
    {
        tab: PlaygroundTab.SettingsApiKeys,
        label: "API keys",
        description: "Let Claude file issues over MCP.",
        icon: SettingsApiKeysIcon,
        facets: ["MCP server URL", "New key", "Revoke keys"],
    },
    {
        tab: PlaygroundTab.SettingsConnectors,
        label: "Connectors",
        description: "Where agent questions reach you.",
        icon: SettingsConnectorsIcon,
        facets: ["Slack", "Telegram", "Connect", "Disconnect"],
    },
];

export const PROJECT_SETTINGS: SettingsItem[] = [
    {
        tab: PlaygroundTab.SettingsProject,
        label: "General",
        description: "Name, slug, board, danger zone.",
        icon: SettingsGeneralIcon,
        facets: ["Name & icon", "Slug", "Options bar", "Product Diff", "Danger zone"],
    },
    {
        tab: PlaygroundTab.SettingsTemplates,
        label: "Issue templates",
        description: "Prefilled bodies for new issues.",
        icon: SettingsTemplatesIcon,
        facets: ["New template", "Edit templates"],
    },
    {
        tab: PlaygroundTab.SettingsEnv,
        label: "Environment variables",
        description: "Secrets the runners boot with.",
        icon: EnvSecretIcon,
        facets: ["Add variable", "Manage secrets"],
    },
    {
        tab: PlaygroundTab.SettingsHarness,
        label: "AI Harness",
        description: "Harness, model, and effort.",
        icon: HarnessIcon,
        facets: ["Harness", "Default model", "Default effort"],
    },
    {
        tab: PlaygroundTab.SettingsIntegrations,
        label: "Integrations",
        description: "GitHub issues on the board.",
        icon: SettingsIntegrationsIcon,
        facets: ["GitHub", "Import issues"],
    },
];

export function filterSettingsItems(query: string, hasProject: boolean) {
    const needle = query.trim().toLowerCase();
    const matches = (item: SettingsItem) =>
        item.label.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.facets.some((facet) => facet.toLowerCase().includes(needle));
    const accountItems = ACCOUNT_SETTINGS.filter(matches);
    const projectItems = hasProject ? PROJECT_SETTINGS.filter(matches) : [];

    return {
        accountItems,
        projectItems,
        topMatch: needle ? [...accountItems, ...projectItems][0] : undefined,
    };
}
