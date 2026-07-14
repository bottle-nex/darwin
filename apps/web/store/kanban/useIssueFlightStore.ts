import { create } from "zustand";
import type { Issue, KanbanStatus } from "@/types/kanban";

/**
 * Carries the full `Issue`, not just its id — the overlay renders a ghost card
 * from it, and capturing it at trigger-time means the overlay stays a self-
 * contained, prop-less component instead of needing the board threaded to it too.
 */
export type IssueFlight = { issue: Issue; targetStatus: KanbanStatus };

interface IssueFlightState {
    flight: IssueFlight | null;
    /** No-ops if a flight is already in progress — one animation at a time. */
    start: (issue: Issue, targetStatus: KanbanStatus) => void;
    finish: () => void;
}

export const useIssueFlightStore = create<IssueFlightState>((set) => ({
    flight: null,
    start: (issue, targetStatus) =>
        set((s) => (s.flight ? s : { flight: { issue, targetStatus } })),
    finish: () => set({ flight: null }),
}));
