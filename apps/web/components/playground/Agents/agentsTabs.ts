/**
 * Tabs for the Agents surface. `AllRuns` is the default landing tab; selecting a
 * specific agent carries its id through as the active tab and the main pane
 * falls through to the agent detail pane.
 */
export enum AgentsTab {
    AllRuns = "all-runs",
}

export const AGENTS_DEFAULT_TAB: AgentsTab = AgentsTab.AllRuns;
