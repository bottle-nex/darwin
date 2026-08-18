import { create } from "zustand";
import type { BoardView, KanbanStatus, KanbanView } from "@/types/kanban";

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
    /** Which board(s) to show, and whether the LLM board is a grid or a list. */
    boardView: BoardView;
    kanbanView: KanbanView;
    setFocus: (focus: FocusValue) => void;
    setBoardView: (view: BoardView) => void;
    setKanbanView: (view: KanbanView) => void;
}

/**
 * Board toolbar view state: which column is focused full-width, and the
 * board/kanban view toggles. Issue-narrowing filters live in
 * `useKanbanFilterStore`.
 */
export const useKanbanOptionsStore = create<KanbanOptionsState>((set) => ({
    focus: NO_FOCUS,
    boardView: "default",
    kanbanView: "board",

    setFocus: (focus) => set({ focus }),
    setBoardView: (boardView) => set({ boardView }),
    setKanbanView: (kanbanView) => set({ kanbanView }),
}));
