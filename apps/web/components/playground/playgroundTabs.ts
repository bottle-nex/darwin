import { DefaultHomeView } from "@trymatcha/types";

/**
 * The playground's tabs. Each value is the id of the sidebar row that selects
 * it, so the active tab, row highlighting, and the main-pane switch all key off
 * the same string (see `usePlaygroundNavStore`).
 */
export enum PlaygroundTab {
    Inbox = "inbox",
    Chats = "chats",
    Agent = "agent",
    AskDarwin = "ask-darwin",
    Spaces = "spaces",
    Space = "space",
    Gantt = "gantt",
    Tags = "tags",
    AssignedToMe = "assigned-to-me",
    TeamDetail = "team-detail",
    SettingsOverview = "settings-overview",
    SettingsAppearance = "settings-appearance",
    SettingsApiKeys = "settings-api-keys",
    SettingsConnectors = "settings-connectors",
    SettingsProject = "settings-project",
    SettingsTemplates = "settings-templates",
    SettingsEnv = "settings-env",
    SettingsHarness = "settings-harness",
    SettingsIntegrations = "settings-integrations",
}

export const ACCOUNT_SETTINGS_TABS: PlaygroundTab[] = [
    PlaygroundTab.SettingsAppearance,
    PlaygroundTab.SettingsApiKeys,
    PlaygroundTab.SettingsConnectors,
];

export const PROJECT_SETTINGS_TABS: PlaygroundTab[] = [
    PlaygroundTab.SettingsProject,
    PlaygroundTab.SettingsTemplates,
    PlaygroundTab.SettingsEnv,
    PlaygroundTab.SettingsHarness,
    PlaygroundTab.SettingsIntegrations,
];

const SETTINGS_TABS = new Set<string>([
    PlaygroundTab.SettingsOverview,
    ...ACCOUNT_SETTINGS_TABS,
    ...PROJECT_SETTINGS_TABS,
]);

export function isSettingsTab(tab: string): boolean {
    return SETTINGS_TABS.has(tab);
}

export const PLAYGROUND_DEFAULT_TAB: PlaygroundTab = PlaygroundTab.Agent;

const PLAYGROUND_TABS = new Set<string>(Object.values(PlaygroundTab));

export function isPlaygroundTab(tab: string): tab is PlaygroundTab {
    return PLAYGROUND_TABS.has(tab);
}

export const DEFAULT_HOME_VIEW_OPTIONS: { tab: PlaygroundTab; label: string }[] = [
    { tab: PlaygroundTab.Inbox, label: "Inbox" },
    { tab: PlaygroundTab.Chats, label: "Chats" },
    { tab: PlaygroundTab.Agent, label: "Agent" },
    { tab: PlaygroundTab.Spaces, label: "Spaces" },
    { tab: PlaygroundTab.Gantt, label: "Gantt" },
    { tab: PlaygroundTab.Tags, label: "Tags" },
    { tab: PlaygroundTab.AssignedToMe, label: "My issues" },
];

const DEFAULT_HOME_VIEW_TO_TAB: Record<DefaultHomeView, PlaygroundTab> = {
    [DefaultHomeView.Inbox]: PlaygroundTab.Inbox,
    [DefaultHomeView.Chats]: PlaygroundTab.Chats,
    [DefaultHomeView.Kanban]: PlaygroundTab.Agent,
    [DefaultHomeView.Spaces]: PlaygroundTab.Spaces,
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
