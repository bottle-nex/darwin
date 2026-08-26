import { DefaultHomeView } from "@trymatcha/types";

/**
 * The playground's tabs. Each value is the id of the sidebar row that selects
 * it, so the active tab, row highlighting, and the main-pane switch all key off
 * the same string (see `usePlaygroundNavStore`).
 */
export enum PlaygroundTab {
    Inbox = "inbox",
    Chats = "chats",
    Kanban = "kanban",
    Gantt = "gantt",
    Tags = "tags",
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

export const PLAYGROUND_DEFAULT_TAB: PlaygroundTab = PlaygroundTab.Kanban;

const PLAYGROUND_TABS = new Set<string>(Object.values(PlaygroundTab));

export function isPlaygroundTab(tab: string): tab is PlaygroundTab {
    return PLAYGROUND_TABS.has(tab);
}

export const DEFAULT_HOME_VIEW_OPTIONS: { tab: PlaygroundTab; label: string }[] = [
    { tab: PlaygroundTab.Inbox, label: "Inbox" },
    { tab: PlaygroundTab.Chats, label: "Chats" },
    { tab: PlaygroundTab.Kanban, label: "Kanban" },
    { tab: PlaygroundTab.Gantt, label: "Gantt" },
    { tab: PlaygroundTab.Tags, label: "Tags" },
    { tab: PlaygroundTab.AssignedToMe, label: "My issues" },
];

const DEFAULT_HOME_VIEW_TO_TAB: Record<DefaultHomeView, PlaygroundTab> = {
    [DefaultHomeView.Inbox]: PlaygroundTab.Inbox,
    [DefaultHomeView.Chats]: PlaygroundTab.Chats,
    [DefaultHomeView.Kanban]: PlaygroundTab.Kanban,
    [DefaultHomeView.Gantt]: PlaygroundTab.Gantt,
    [DefaultHomeView.Tags]: PlaygroundTab.Tags,
    [DefaultHomeView.AssignedToMe]: PlaygroundTab.AssignedToMe,
};

const TAB_TO_DEFAULT_HOME_VIEW = Object.fromEntries(
    Object.entries(DEFAULT_HOME_VIEW_TO_TAB).map(([view, tab]) => [tab, view]),
) as Partial<Record<PlaygroundTab, DefaultHomeView>>;

export function defaultHomeViewToTab(view: DefaultHomeView): PlaygroundTab {
    return DEFAULT_HOME_VIEW_TO_TAB[view];
}

export function tabToDefaultHomeView(tab: PlaygroundTab): DefaultHomeView | undefined {
    return TAB_TO_DEFAULT_HOME_VIEW[tab];
}
