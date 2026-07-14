import { create } from "zustand";
import { Surface } from "@/components/playground/Sidebar/surface";
import { HOME_DEFAULT_TAB } from "@/components/playground/Home/homeTabs";
import { PROJECTS_DEFAULT_TAB } from "@/components/playground/Projects/projectsTabs";
import { PULL_REQUESTS_DEFAULT_TAB } from "@/components/playground/PullRequests/pullRequestsTabs";
import { AGENTS_DEFAULT_TAB } from "@/components/playground/Agents/agentsTabs";
import { WORKERS_DEFAULT_TAB } from "@/components/playground/Workers/workersTabs";
import { MORE_DEFAULT_TAB } from "@/components/playground/More/moreTabs";
import type { ProjectTeam } from "@/types/project";

/** Default landing tab for each surface, used on first load and on reset. */
const DEFAULT_TAB: Record<Surface, string> = {
    [Surface.Home]: HOME_DEFAULT_TAB,
    [Surface.Projects]: PROJECTS_DEFAULT_TAB,
    [Surface.PullRequests]: PULL_REQUESTS_DEFAULT_TAB,
    [Surface.Agents]: AGENTS_DEFAULT_TAB,
    [Surface.Workers]: WORKERS_DEFAULT_TAB,
    [Surface.More]: MORE_DEFAULT_TAB,
};

/**
 * The tab value Home and Projects use to render the shared team-detail pane.
 * Mirrors `HomeTab.TeamDetail` / `ProjectsTab.TeamDetail`.
 */
export const TEAM_DETAIL_TAB = "team-detail";

/**
 * Central navigation state for the playground workspace.
 *
 * `surface` is the active top-level surface; `tabBySurface` remembers the active
 * tab for each surface independently (so switching surfaces restores the last
 * tab). A tab value is the id of the sidebar row that selected it — static rows
 * commit their id directly, and entity rows (PRs/agents/workers) carry their id
 * through, so the main-pane switch and active-row styling share one source.
 * `selectedTeam` is the payload for the team-detail pane, which needs the full
 * team object rather than just an id.
 */
interface PlaygroundNavState {
    surface: Surface;
    tabBySurface: Record<Surface, string>;
    selectedTeam: ProjectTeam | null;
    /** Slug of the project the selected team belongs to — guards stale detail. */
    selectedTeamProjectSlug: string | null;
    setSurface: (surface: Surface) => void;
    setTab: (surface: Surface, tabId: string) => void;
    openTeam: (surface: Surface, team: ProjectTeam, projectSlug: string) => void;
    clearTeam: (surface: Surface) => void;
}

export const usePlaygroundNavStore = create<PlaygroundNavState>((set) => ({
    surface: Surface.Home,
    tabBySurface: { ...DEFAULT_TAB },
    selectedTeam: null,
    selectedTeamProjectSlug: null,
    setSurface: (surface) => set({ surface }),
    setTab: (surface, tabId) =>
        set((state) => ({ tabBySurface: { ...state.tabBySurface, [surface]: tabId } })),
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
