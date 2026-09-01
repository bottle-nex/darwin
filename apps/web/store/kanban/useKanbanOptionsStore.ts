import { create } from "zustand";

import type { KanbanStatus } from "@/types/kanban";

/**
 * The Focus selection: the normal multi-column board, or a single focused
 * column — either an LLM status or a user-built custom column.
 */
export type FocusValue =
    | { kind: "default" }
    | { kind: "llm"; status: KanbanStatus }
    | { kind: "custom"; columnId: string };

/** The cleared focus — the normal multi-column board. */
export const NO_FOCUS: FocusValue = { kind: "default" };

interface KanbanOptionsState {
    focus: FocusValue;
    setFocus: (focus: FocusValue) => void;
}

/**
 * Which column a pane is focused on, full width. Layout and grouping are saved
 * per user — see `useIssueView`. Which board a pane shows is navigation state —
 * see `usePlaygroundNavStore`. Issue-narrowing filters live in
 * `useKanbanFilterStore`.
 */
export const useKanbanOptionsStore = create<KanbanOptionsState>((set) => ({
    focus: NO_FOCUS,
    setFocus: (focus) => set({ focus }),
}));
