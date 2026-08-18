import { create } from "zustand";
import { emptyFacetValue } from "@/lib/kanban/boardFilter";
import {
    EMPTY_FILTERS,
    type BoardFilters,
    type FacetKey,
    type ListFacetKey,
} from "@/types/boardFilter";

interface KanbanFilterState {
    filters: BoardFilters;
    setFacet: <K extends FacetKey>(key: K, value: BoardFilters[K]) => void;
    /** The menus deal in strings; `priorities` is the one numeric facet. */
    setListFacet: (key: ListFacetKey, values: string[]) => void;
    clearFacet: (key: FacetKey) => void;
    setFilters: (filters: BoardFilters) => void;
    clearAll: () => void;
}

export const useKanbanFilterStore = create<KanbanFilterState>((set) => ({
    filters: EMPTY_FILTERS,

    setFacet: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
    setListFacet: (key, values) =>
        set((s) => ({
            filters: {
                ...s.filters,
                [key]: key === "priorities" ? values.map(Number) : values,
            },
        })),
    clearFacet: (key) => set((s) => ({ filters: { ...s.filters, [key]: emptyFacetValue(key) } })),
    setFilters: (filters) => set({ filters }),
    clearAll: () => set({ filters: EMPTY_FILTERS }),
}));
