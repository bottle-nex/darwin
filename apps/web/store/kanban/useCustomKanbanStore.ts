import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { INITIAL_CUSTOM_COLUMNS } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import { CustomKanbanMappers } from "@/lib/kanban/CustomKanbanMappers";
import type { BoardResponse } from "@/types/board";
import type { CustomCard, CustomColumn } from "@/types/kanban-custom";
import type { Issue } from "@/types/kanban";

/** The active drag — a custom card being moved, an LLM issue dragged in, or a column being reordered. */
export type ActiveItem =
    | { kind: "custom"; card: CustomCard }
    | { kind: "issue"; issue: Issue }
    | { kind: "column"; column: CustomColumn };

interface CustomKanbanState {
    columns: CustomColumn[];
    seededBoard: BoardResponse | undefined;
    activeItem: ActiveItem | null;
    /** Seed (and re-seed) the columns from the server board. */
    seed: (board: BoardResponse) => void;
    setActiveItem: (item: ActiveItem | null) => void;
    addColumnLocal: (column: CustomColumn) => void;
    removeColumnLocal: (columnId: string) => void;
    renameColumnLocal: (columnId: string, label: string) => void;
    removeCardLocal: (cardId: string) => void;
    /** Insert a card into a column, at `overId`'s position if it's a card there. */
    insertCard: (columnId: string, card: CustomCard, overId: string) => void;
    /** Move a card from one column to another, at `overId`'s position in the target. */
    moveCardBetweenColumns: (
        cardId: string,
        fromColumnId: string,
        toColumnId: string,
        overId: string,
    ) => void;
    /** Reorder a card within its own column. */
    reorderCard: (columnId: string, activeId: string, overId: string) => void;
    /** Reorder a custom column among its siblings. */
    reorderColumn: (activeId: string, overColumnId: string) => void;
}

/**
 * Column/card state for the user-built Custom Kanban. Cards reorder and move
 * freely between custom columns; which LLM columns bridge with it is decided by
 * `BRIDGE_STATUSES` (see `customkanban/data.ts`) — this store stays status-agnostic,
 * `useCustomKanban` decides when a card crosses into/out of the LLM board.
 */
export const useCustomKanbanStore = create<CustomKanbanState>((set, get) => ({
    columns: INITIAL_CUSTOM_COLUMNS,
    seededBoard: undefined,
    activeItem: null,

    seed: (board) => {
        if (board === get().seededBoard) return;
        set({ seededBoard: board, columns: CustomKanbanMappers.boardToColumns(board) });
    },

    setActiveItem: (activeItem) => set({ activeItem }),

    addColumnLocal: (column) => set((s) => ({ columns: [...s.columns, column] })),

    removeColumnLocal: (columnId) =>
        set((s) => ({ columns: s.columns.filter((col) => col.id !== columnId) })),

    renameColumnLocal: (columnId, label) =>
        set((s) => ({
            columns: s.columns.map((col) => (col.id === columnId ? { ...col, title: label } : col)),
        })),

    removeCardLocal: (cardId) =>
        set((s) => ({
            columns: s.columns.map((col) => ({
                ...col,
                cards: col.cards.filter((c) => c.id !== cardId),
            })),
        })),

    insertCard: (columnId, card, overId) =>
        set((s) => ({
            columns: s.columns.map((col) => {
                if (col.id !== columnId) return col;
                const overIndex = col.cards.findIndex((c) => c.id === overId);
                const at = overIndex >= 0 ? overIndex : col.cards.length;
                return { ...col, cards: [...col.cards.slice(0, at), card, ...col.cards.slice(at)] };
            }),
        })),

    moveCardBetweenColumns: (cardId, fromColumnId, toColumnId, overId) =>
        set((s) => {
            const moved = s.columns
                .find((c) => c.id === fromColumnId)
                ?.cards.find((c) => c.id === cardId);
            const toCol = s.columns.find((c) => c.id === toColumnId);
            if (!moved || !toCol) return s;
            const overIndex = toCol.cards.findIndex((c) => c.id === overId);
            const insertAt = overIndex >= 0 ? overIndex : toCol.cards.length;
            return {
                columns: s.columns.map((col) => {
                    if (col.id === fromColumnId) {
                        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
                    }
                    if (col.id === toColumnId) {
                        return {
                            ...col,
                            cards: [
                                ...col.cards.slice(0, insertAt),
                                moved,
                                ...col.cards.slice(insertAt),
                            ],
                        };
                    }
                    return col;
                }),
            };
        }),

    reorderCard: (columnId, activeId, overId) =>
        set((s) => ({
            columns: s.columns.map((col) => {
                if (col.id !== columnId) return col;
                const oldIndex = col.cards.findIndex((c) => c.id === activeId);
                const newIndex = col.cards.findIndex((c) => c.id === overId);
                if (newIndex < 0 || oldIndex === newIndex) return col;
                return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) };
            }),
        })),

    reorderColumn: (activeId, overColumnId) =>
        set((s) => {
            const oldIndex = s.columns.findIndex((c) => c.id === activeId);
            const newIndex = s.columns.findIndex((c) => c.id === overColumnId);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return s;
            return { columns: arrayMove(s.columns, oldIndex, newIndex) };
        }),
}));

/** Locate a card (and the column holding it) by id. */
export function findCardInColumns(
    columns: CustomColumn[],
    cardId: string,
): { columnId: string; card: CustomCard } | null {
    for (const col of columns) {
        const card = col.cards.find((c) => c.id === cardId);
        if (card) return { columnId: col.id, card };
    }
    return null;
}

/** The column for an id — itself if it's a column, else the card's column. */
export function columnIdOfInColumns(columns: CustomColumn[], id: string): string | null {
    if (columns.some((c) => c.id === id)) return id;
    return columns.find((c) => c.cards.some((card) => card.id === id))?.id ?? null;
}
