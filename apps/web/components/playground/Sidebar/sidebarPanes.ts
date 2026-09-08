import { isSettingsTab, PlaygroundTab } from "../playgroundTabs";

/**
 * Which of the sidebar's three faces is showing.
 *
 * The sidebar swaps its whole body rather than opening a second panel beside itself, so this is
 * one value rather than a set of booleans — two of them could otherwise both be true.
 */
export type SidebarPane = "workspace" | "settings" | "darwin";

/**
 * The pane a tab implies.
 *
 * Derived rather than stored: the tab is already the source of truth for what the main area
 * shows, and a separate "which pane is open" flag would be a second thing to keep in step.
 *
 * @example
 * paneForTab(PlaygroundTab.AskDarwin); // "darwin"
 */
export function paneForTab(tab: string): SidebarPane {
    if (isSettingsTab(tab)) return "settings";
    if (tab === PlaygroundTab.AskDarwin) return "darwin";
    return "workspace";
}
