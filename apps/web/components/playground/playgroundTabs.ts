/**
 * The playground's tabs. Each value is the id of the sidebar row that selects
 * it, so the active tab, row highlighting, and the main-pane switch all key off
 * the same string (see `usePlaygroundNavStore`).
 */
export enum PlaygroundTab {
    Inbox = "inbox",
    Chats = "chats",
    Kanban = "kanban",
    Overview = "overview",
    Gantt = "gantt",
    Tags = "tags",
    Reviews = "reviews",
    AssignedToMe = "assigned-to-me",
    TeamDetail = "team-detail",
    SettingsAppearance = "settings-appearance",
    SettingsApiKeys = "settings-api-keys",
    SettingsProject = "settings-project",
    SettingsTemplates = "settings-templates",
    SettingsEnv = "settings-env",
}

export const ACCOUNT_SETTINGS_TABS: PlaygroundTab[] = [
    PlaygroundTab.SettingsAppearance,
    PlaygroundTab.SettingsApiKeys,
];

export const PROJECT_SETTINGS_TABS: PlaygroundTab[] = [
    PlaygroundTab.SettingsProject,
    PlaygroundTab.SettingsTemplates,
    PlaygroundTab.SettingsEnv,
];

const SETTINGS_TABS = new Set<string>([...ACCOUNT_SETTINGS_TABS, ...PROJECT_SETTINGS_TABS]);

export function isSettingsTab(tab: string): boolean {
    return SETTINGS_TABS.has(tab);
}

export const PLAYGROUND_DEFAULT_TAB: PlaygroundTab = PlaygroundTab.Overview;
