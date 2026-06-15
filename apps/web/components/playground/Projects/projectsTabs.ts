/**
 * Tabs for the Projects surface. The sidebar has two modes, both keyed off the
 * active tab: `Overview` shows the project list (with a blank main pane), and the
 * four `Settings*` tabs put the sidebar into per-project settings mode (a Back row
 * + the settings sections) while the main pane renders that section. `TeamDetail`
 * and `Gantt` are auxiliary panes shared with other surfaces.
 */
export enum ProjectsTab {
    Overview = "projects-overview",
    TeamDetail = "team-detail",
    Gantt = "gantt",
    SettingsProject = "project-settings",
    SettingsTeams = "project-settings-teams",
    SettingsMembers = "project-settings-members",
    SettingsEnv = "project-settings-env",
}

export const PROJECTS_DEFAULT_TAB: ProjectsTab = ProjectsTab.Overview;

/** The settings tabs, in the order the sidebar nav lists them. */
export const PROJECT_SETTINGS_TABS = [
    ProjectsTab.SettingsProject,
    ProjectsTab.SettingsTeams,
    ProjectsTab.SettingsMembers,
    ProjectsTab.SettingsEnv,
] as const;

/** True when a tab value puts the Projects sidebar into settings mode. */
export function isProjectSettingsTab(tab: string): boolean {
    return (PROJECT_SETTINGS_TABS as readonly string[]).includes(tab);
}
