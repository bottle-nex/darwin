"use client";
import { useState } from "react";
import { KanbanStatus } from "./types";

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

/**
 * Board toolbar state: the search bar, the label filter, and the focus filter.
 * Search + labels narrow which issues show; the focus filter picks a single
 * column (LLM or custom) to expand full-width as a grid. Kept local — these are
 * view preferences, not something to persist.
 */
export function useKanbanOptions() {
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [filter, setFilter] = useState<FilterValue>(NO_FILTER);

    const openSearch = () => setSearchOpen(true);
    const closeSearch = () => {
        setSearchOpen(false);
        setSearch("");
    };

    const toggleLabel = (name: string) =>
        setSelectedLabels((prev) =>
            prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name],
        );
    const removeLabel = (name: string) =>
        setSelectedLabels((prev) => prev.filter((l) => l !== name));
    const clearLabels = () => setSelectedLabels([]);

    return {
        searchOpen,
        search,
        setSearch,
        openSearch,
        closeSearch,
        selectedLabels,
        toggleLabel,
        removeLabel,
        clearLabels,
        filter,
        setFilter,
    };
}

export type KanbanOptions = ReturnType<typeof useKanbanOptions>;
