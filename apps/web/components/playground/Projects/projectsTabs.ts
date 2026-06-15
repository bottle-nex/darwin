/**
 * Tabs for the Projects surface — the views a single project exposes. The first
 * three are top-level views; the `Settings*` tabs are the settings sections. All
 * of them are listed in the project sidebar nav (`ProjectNav`); `TeamDetail` is an
 * auxiliary pane shared with other surfaces.
 */
export enum ProjectsTab {
    Overview = "project-overview",
    Kanban = "project-kanban",
    Gantt = "project-gantt",
    SettingsProject = "project-settings",
    SettingsTeams = "project-settings-teams",
    SettingsMembers = "project-settings-members",
    SettingsEnv = "project-settings-env",
    TeamDetail = "team-detail",
}

export const PROJECTS_DEFAULT_TAB: ProjectsTab = ProjectsTab.Overview;

/** Human label for each tab — used by the sidebar nav and the header breadcrumb. */
export const PROJECT_TAB_LABELS: Record<ProjectsTab, string> = {
    [ProjectsTab.Overview]: "Overview",
    [ProjectsTab.Kanban]: "Kanban",
    [ProjectsTab.Gantt]: "Gantt",
    [ProjectsTab.SettingsProject]: "Project",
    [ProjectsTab.SettingsTeams]: "Teams",
    [ProjectsTab.SettingsMembers]: "Members",
    [ProjectsTab.SettingsEnv]: "Environment variables",
    [ProjectsTab.TeamDetail]: "Team",
};
