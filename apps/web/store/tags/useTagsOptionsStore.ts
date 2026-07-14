import { create } from "zustand";

/** How the tag list is ordered: alphabetically, or newest first. */
export type TagSort = "name" | "newest";

interface TagsOptionsState {
    searchOpen: boolean;
    search: string;
    sort: TagSort;
    openSearch: () => void;
    closeSearch: () => void;
    setSearch: (search: string) => void;
    setSort: (sort: TagSort) => void;
}

/**
 * Tags toolbar state: the slide-in search box and the sort order. Search narrows
 * the list by name; sort reorders it.
 */
export const useTagsOptionsStore = create<TagsOptionsState>((set) => ({
    searchOpen: false,
    search: "",
    sort: "name",

    openSearch: () => set({ searchOpen: true }),
    closeSearch: () => set({ searchOpen: false, search: "" }),
    setSearch: (search) => set({ search }),
    setSort: (sort) => set({ sort }),
}));
