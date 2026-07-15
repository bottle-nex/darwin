/**
 * Tabs for the Home surface. Each value is the id of the sidebar row that
 * selects it, so the active tab, row highlighting, and the main-pane switch all
 * key off the same string (see `usePlaygroundNavStore`).
 */
export enum HomeTab {
    Inbox = "inbox",
    Kanban = "kanban",
    Overview = "overview",
    Gantt = "gantt",
    Tags = "tags",
    Mentions = "mentions",
    Reviews = "reviews",
    AssignedToMe = "assigned-to-me",
    InProgress = "in-progress",
    Drafts = "drafts",
    TeamDetail = "team-detail",
    // Settings sections — selecting any of these swaps the Home sidebar to its
    // settings face (see `HomeSidebar` / `HomeSettingsNav`).
    SettingsProject = "settings-project",
    SettingsTemplates = "settings-templates",
    SettingsEnv = "settings-env",
}

export const HOME_DEFAULT_TAB: HomeTab = HomeTab.Inbox;
