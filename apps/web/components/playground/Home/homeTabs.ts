/**
 * Tabs for the Home surface. Each value is the id of the sidebar row that
 * selects it, so the active tab, row highlighting, and the main-pane switch all
 * key off the same string (see `usePlaygroundNavStore`).
 */
export enum HomeTab {
    Inbox = "inbox",
    Setup = "setup",
    Kanban = "kanban",
    Mentions = "mentions",
    Reviews = "reviews",
    AssignedToMe = "assigned-to-me",
    InProgress = "in-progress",
    Drafts = "drafts",
    TeamDetail = "team-detail",
}

export const HOME_DEFAULT_TAB: HomeTab = HomeTab.Inbox;
