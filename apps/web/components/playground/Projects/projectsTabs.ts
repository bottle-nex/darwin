/**
 * Tabs for the Projects surface. Selecting a project routes to its URL and shows
 * its Gantt timeline; the overview and shared team-detail pane round it out.
 */
export enum ProjectsTab {
    Overview = "projects-overview",
    TeamDetail = "team-detail",
    Gantt = "gantt",
    Settings = "project-settings",
}

export const PROJECTS_DEFAULT_TAB: ProjectsTab = ProjectsTab.Settings;
