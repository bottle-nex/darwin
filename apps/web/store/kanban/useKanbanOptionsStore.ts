import { create } from "zustand";

import type { KanbanStatus, KanbanView } from "@/types/kanban";

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
    /** Whether the board renders as a column grid or a flat list. */
    kanbanView: KanbanView;
    setFocus: (focus: FocusValue) => void;
    setKanbanView: (view: KanbanView) => void;
}

/**
 * Board toolbar view state: which column is focused full-width, and the
 * board/list layout toggle. Which board a pane shows is navigation state now —
 * see `usePlaygroundNavStore`. Issue-narrowing filters live in
 * `useKanbanFilterStore`.
 */
export const useKanbanOptionsStore = create<KanbanOptionsState>((set) => ({
    focus: NO_FOCUS,
    kanbanView: "board",

    setFocus: (focus) => set({ focus }),
    setKanbanView: (kanbanView) => set({ kanbanView }),
}));
