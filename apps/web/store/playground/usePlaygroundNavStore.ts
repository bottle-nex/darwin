import { create } from "zustand";
import { RailSurface } from "@/components/playground/IconRail/railSurface";
import { HOME_DEFAULT_TAB } from "@/components/playground/Home/homeTabs";
import { PROJECTS_DEFAULT_TAB } from "@/components/playground/Projects/projectsTabs";
import { PULL_REQUESTS_DEFAULT_TAB } from "@/components/playground/PullRequests/pullRequestsTabs";
import { AGENTS_DEFAULT_TAB } from "@/components/playground/Agents/agentsTabs";
import { WORKERS_DEFAULT_TAB } from "@/components/playground/Workers/workersTabs";
import { MORE_DEFAULT_TAB } from "@/components/playground/More/moreTabs";
import type { ProjectTeam } from "@/types/project";

/** Default landing tab for each surface, used on first load and on reset. */
const DEFAULT_TAB: Record<RailSurface, string> = {
    [RailSurface.Home]: HOME_DEFAULT_TAB,
    [RailSurface.Projects]: PROJECTS_DEFAULT_TAB,
    [RailSurface.PullRequests]: PULL_REQUESTS_DEFAULT_TAB,
    [RailSurface.Agents]: AGENTS_DEFAULT_TAB,
    [RailSurface.Workers]: WORKERS_DEFAULT_TAB,
    [RailSurface.More]: MORE_DEFAULT_TAB,
};

/**
 * The tab value Home and Projects use to render the shared team-detail pane.
 * Mirrors `HomeTab.TeamDetail` / `ProjectsTab.TeamDetail`.
 */
export const TEAM_DETAIL_TAB = "team-detail";

/**
 * The Projects sidebar has two faces: the project `list` (shown when the Projects
 * rail icon is tapped) and a single project's `nav` (shown once a project is
 * opened). It's its own bit of state because both faces can share the same active
 * tab, so the tab alone can't tell them apart.
 */
export type ProjectsSidebarMode = "list" | "nav";

/**
 * Central navigation state for the playground workspace.
 *
 * `surface` is the active icon-rail surface; `tabBySurface` remembers the active
 * tab for each surface independently (so switching rail icons restores the last
 * tab). A tab value is the id of the sidebar row that selected it — static rows
 * commit their id directly, and entity rows (PRs/agents/workers) carry their id
 * through, so the main-pane switch and active-row styling share one source.
 * `selectedTeam` is the payload for the team-detail pane, which needs the full
 * team object rather than just an id.
 */
interface PlaygroundNavState {
    surface: RailSurface;
    tabBySurface: Record<RailSurface, string>;
    selectedTeam: ProjectTeam | null;
    /** Slug of the project the selected team belongs to — guards stale detail. */
    selectedTeamProjectSlug: string | null;
    /** Which face the Projects sidebar shows — the project list or a project's nav. */
    projectsSidebarMode: ProjectsSidebarMode;
    setSurface: (surface: RailSurface) => void;
    setTab: (surface: RailSurface, tabId: string) => void;
    setProjectsSidebarMode: (mode: ProjectsSidebarMode) => void;
    openTeam: (surface: RailSurface, team: ProjectTeam, projectSlug: string) => void;
    clearTeam: (surface: RailSurface) => void;
}

export const usePlaygroundNavStore = create<PlaygroundNavState>((set) => ({
    surface: RailSurface.Home,
    tabBySurface: { ...DEFAULT_TAB },
    selectedTeam: null,
    selectedTeamProjectSlug: null,
    projectsSidebarMode: "nav",
    setSurface: (surface) => set({ surface }),
    setTab: (surface, tabId) =>
        set((state) => ({ tabBySurface: { ...state.tabBySurface, [surface]: tabId } })),
    setProjectsSidebarMode: (mode) => set({ projectsSidebarMode: mode }),
    openTeam: (surface, team, projectSlug) =>
        set((state) => ({
            selectedTeam: team,
            selectedTeamProjectSlug: projectSlug,
            tabBySurface: { ...state.tabBySurface, [surface]: TEAM_DETAIL_TAB },
        })),
    clearTeam: (surface) =>
        set((state) => ({
            selectedTeam: null,
            selectedTeamProjectSlug: null,
            tabBySurface: { ...state.tabBySurface, [surface]: DEFAULT_TAB[surface] },
        })),
}));
