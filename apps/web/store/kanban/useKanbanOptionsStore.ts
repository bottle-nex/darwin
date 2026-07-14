import { create } from "zustand";
import type { BoardView, KanbanStatus, KanbanView } from "@/types/kanban";

/**
 * The Filter selection: the normal multi-column board, or a single focused
 * column — either an LLM status or a user-built custom column.
 */
export type FilterValue =
    | { kind: "default" }
    | { kind: "llm"; status: KanbanStatus }
    | { kind: "custom"; columnId: string };

/** The cleared filter — the normal multi-column board. */
export const NO_FILTER: FilterValue = { kind: "default" };

interface KanbanOptionsState {
    searchOpen: boolean;
    search: string;
    selectedTagIds: string[];
    filter: FilterValue;
    /** Which board(s) to show, and whether the LLM board is a grid or a list. */
    boardView: BoardView;
    kanbanView: KanbanView;
    openSearch: () => void;
    closeSearch: () => void;
    setSearch: (search: string) => void;
    toggleTag: (id: string) => void;
    removeTag: (id: string) => void;
    clearTags: () => void;
    setFilter: (filter: FilterValue) => void;
    setBoardView: (view: BoardView) => void;
    setKanbanView: (view: KanbanView) => void;
}

/**
 * Board toolbar state: the search bar, the tag filter, the focus filter, and the
 * board/kanban view toggles. Search + tags narrow which issues show; the focus
 * filter picks a single column (LLM or custom) to expand full-width as a grid.
 */
export const useKanbanOptionsStore = create<KanbanOptionsState>((set) => ({
    searchOpen: false,
    search: "",
    selectedTagIds: [],
    filter: NO_FILTER,
    boardView: "default",
    kanbanView: "board",

    openSearch: () => set({ searchOpen: true }),
    closeSearch: () => set({ searchOpen: false, search: "" }),
    setSearch: (search) => set({ search }),
    toggleTag: (id) =>
        set((s) => ({
            selectedTagIds: s.selectedTagIds.includes(id)
                ? s.selectedTagIds.filter((t) => t !== id)
                : [...s.selectedTagIds, id],
        })),
    removeTag: (id) => set((s) => ({ selectedTagIds: s.selectedTagIds.filter((t) => t !== id) })),
    clearTags: () => set({ selectedTagIds: [] }),
    setFilter: (filter) => set({ filter }),
    setBoardView: (boardView) => set({ boardView }),
    setKanbanView: (kanbanView) => set({ kanbanView }),
}));
