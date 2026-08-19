/**
 * The playground's tabs. Each value is the id of the sidebar row that selects
 * it, so the active tab, row highlighting, and the main-pane switch all key off
 * the same string (see `usePlaygroundNavStore`).
 */
export enum PlaygroundTab {
    Chats = "chats",
    Kanban = "kanban",
    Overview = "overview",
    Gantt = "gantt",
    Tags = "tags",
    Reviews = "reviews",
    AssignedToMe = "assigned-to-me",
    TeamDetail = "team-detail",
    ThreadDetail = "thread-detail",
    SettingsProject = "settings-project",
    SettingsTemplates = "settings-templates",
    SettingsEnv = "settings-env",
}

export const PLAYGROUND_DEFAULT_TAB: PlaygroundTab = PlaygroundTab.Overview;
