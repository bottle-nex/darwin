/**
 * Tabs for the Projects surface. Selecting a project routes to its URL, so the
 * only in-surface tabs are the overview and the shared team-detail pane.
 */
export enum ProjectsTab {
    Overview = "projects-overview",
    TeamDetail = "team-detail",
}

export const PROJECTS_DEFAULT_TAB: ProjectsTab = ProjectsTab.Overview;
