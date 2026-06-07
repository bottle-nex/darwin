/**
 * Tabs for the Workers surface. Selecting a worker row carries its id through as
 * the active tab; the main pane handles `Overview` explicitly and falls through
 * to the worker detail pane for any worker id.
 */
export enum WorkersTab {
    Overview = "workers-overview",
}

export const WORKERS_DEFAULT_TAB: WorkersTab = WorkersTab.Overview;
