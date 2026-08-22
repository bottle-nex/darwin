import { create } from "zustand";
import { isSettingsTab, PLAYGROUND_DEFAULT_TAB } from "@/components/playground/playgroundTabs";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
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

function leave_pane() {
    usePaneRouteStore.getState().openBoard();
    useCreateIssueStore.getState().close();
}

export const usePlaygroundNavStore = create<PlaygroundNavState>((set) => ({
    tab: PLAYGROUND_DEFAULT_TAB,
    lastWorkspaceTab: PLAYGROUND_DEFAULT_TAB,
    selectedTeam: null,
    selectedTeamProjectSlug: null,
    setTab: (tabId) => {
        leave_pane();
        set((state) => ({
            tab: tabId,
            lastWorkspaceTab: isSettingsTab(tabId) ? state.lastWorkspaceTab : tabId,
        }));
    },
    returnFromSettings: () => {
        leave_pane();
        set((state) => ({ tab: state.lastWorkspaceTab }));
    },
    openTeam: (team, projectSlug) => {
        leave_pane();
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
