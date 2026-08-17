import { create } from "zustand";
import { PLAYGROUND_DEFAULT_TAB } from "@/components/playground/playgroundTabs";
import { useIssueStore } from "@/store/issues/useIssueStore";
import type { ProjectTeam } from "@/types/project";

/**
 * The tab value used to render the shared team-detail pane.
 * Mirrors `PlaygroundTab.TeamDetail`.
 */
export const TEAM_DETAIL_TAB = "team-detail";

/**
 * The tab value used to render the shared thread-detail pane.
 * Mirrors `PlaygroundTab.ThreadDetail`.
 */
export const THREAD_DETAIL_TAB = "thread-detail";

/** The conversation open in the thread-detail pane — the project's single general chat, or one issue's comments. */
export type SelectedThread =
    | { kind: "project" }
    | { kind: "issue"; issueId: string; issueNumber: number; issueTitle: string };

/**
 * Central navigation state for the playground workspace.
 *
 * `tab` is the active tab; a tab value is the id of the sidebar row that
 * selected it — static rows commit their id directly, and entity rows carry
 * their id through, so the main-pane switch and active-row styling share one
 * source. `selectedTeam`/`selectedThread` are the payloads for the team- and
 * thread-detail panes, which need the full object rather than just an id.
 */
interface PlaygroundNavState {
    tab: string;
    selectedTeam: ProjectTeam | null;
    /** Slug of the project the selected team belongs to — guards stale detail. */
    selectedTeamProjectSlug: string | null;
    selectedThread: SelectedThread | null;
    /** Slug of the project the selected thread belongs to — guards stale detail. */
    selectedThreadProjectSlug: string | null;
    setTab: (tabId: string) => void;
    openTeam: (team: ProjectTeam, projectSlug: string) => void;
    clearTeam: () => void;
    openThread: (thread: SelectedThread, projectSlug: string) => void;
    clearThread: () => void;
}

export const usePlaygroundNavStore = create<PlaygroundNavState>((set) => ({
    tab: PLAYGROUND_DEFAULT_TAB,
    selectedTeam: null,
    selectedTeamProjectSlug: null,
    selectedThread: null,
    selectedThreadProjectSlug: null,
    setTab: (tabId) => {
        useIssueStore.getState().close();
        set({ tab: tabId });
    },
    openTeam: (team, projectSlug) => {
        useIssueStore.getState().close();
        set({
            selectedTeam: team,
            selectedTeamProjectSlug: projectSlug,
            tab: TEAM_DETAIL_TAB,
        });
    },
    clearTeam: () =>
        set({
            selectedTeam: null,
            selectedTeamProjectSlug: null,
            tab: PLAYGROUND_DEFAULT_TAB,
        }),
    openThread: (thread, projectSlug) => {
        useIssueStore.getState().close();
        set({
            selectedThread: thread,
            selectedThreadProjectSlug: projectSlug,
            tab: THREAD_DETAIL_TAB,
        });
    },
    clearThread: () =>
        set({
            selectedThread: null,
            selectedThreadProjectSlug: null,
            tab: PLAYGROUND_DEFAULT_TAB,
        }),
}));
