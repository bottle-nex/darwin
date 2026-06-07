/**
 * Tabs for the Pull Requests surface. Selecting a PR row carries its id through
 * as the active tab; the main pane handles `Overview` explicitly and falls
 * through to the detail pane for any PR id.
 */
export enum PullRequestsTab {
    Overview = "pr-overview",
}

export const PULL_REQUESTS_DEFAULT_TAB: PullRequestsTab = PullRequestsTab.Overview;
