import { create } from "zustand";

interface RunLogDisclosureState {
    expanded: Record<string, boolean>;
    setExpanded: (runId: string, value: boolean) => void;
}

/**
 * Which runs have their logs open, kept outside the feed because the feed is virtualized.
 *
 * A row that scrolls out of view unmounts, so anything held in the row's own state resets the
 * moment it comes back — a log the reader opened would close itself behind them.
 */
export const useRunLogDisclosureStore = create<RunLogDisclosureState>((set) => ({
    expanded: {},
    setExpanded: (runId, value) =>
        set((state) => ({ expanded: { ...state.expanded, [runId]: value } })),
}));
