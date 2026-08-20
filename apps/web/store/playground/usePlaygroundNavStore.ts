import { create } from "zustand";
import { isSettingsTab, PLAYGROUND_DEFAULT_TAB } from "@/components/playground/playgroundTabs";
import { useIssueStore } from "@/store/issues/useIssueStore";
import type { ProjectTeam } from "@/types/project";

/**
 * The tab value used to render the shared team-detail pane.
 * Mirrors `PlaygroundTab.TeamDetail`.
 */
export const TEAM_DETAIL_TAB = "team-detail";

/**
 * Central navigation state for the playground workspace.
 *
 * `tab` is the active tab; a tab value is the id of the sidebar row that
 * selected it — static rows commit their id directly, and entity rows carry
 * their id through, so the main-pane switch and active-row styling share one
 * source. `selectedTeam` is the payload for the team-detail pane, which needs
 * the full object rather than just an id.
 */
interface PlaygroundNavState {
    tab: string;
    lastWorkspaceTab: string;
    selectedTeam: ProjectTeam | null;
    /** Slug of the project the selected team belongs to — guards stale detail. */
    selectedTeamProjectSlug: string | null;
    setTab: (tabId: string) => void;
    returnFromSettings: () => void;
    openTeam: (team: ProjectTeam, projectSlug: string) => void;
    clearTeam: () => void;
}

export const usePlaygroundNavStore = create<PlaygroundNavState>((set) => ({
    tab: PLAYGROUND_DEFAULT_TAB,
    lastWorkspaceTab: PLAYGROUND_DEFAULT_TAB,
    selectedTeam: null,
    selectedTeamProjectSlug: null,
    setTab: (tabId) => {
        useIssueStore.getState().close();
        set((state) => ({
            tab: tabId,
            lastWorkspaceTab: isSettingsTab(tabId) ? state.lastWorkspaceTab : tabId,
        }));
    },
    returnFromSettings: () => {
        useIssueStore.getState().close();
        set((state) => ({ tab: state.lastWorkspaceTab }));
    },
    openTeam: (team, projectSlug) => {
        useIssueStore.getState().close();
        set({
            selectedTeam: team,
            selectedTeamProjectSlug: projectSlug,
            tab: TEAM_DETAIL_TAB,
            lastWorkspaceTab: TEAM_DETAIL_TAB,
        });
    },
    clearTeam: () =>
        set({
            selectedTeam: null,
            selectedTeamProjectSlug: null,
            tab: PLAYGROUND_DEFAULT_TAB,
            lastWorkspaceTab: PLAYGROUND_DEFAULT_TAB,
        }),
}));
