"use client";
import { useState } from "react";

/** How the tag list is ordered: alphabetically, or newest first. */
export type TagSort = "name" | "newest";

/**
 * Tags toolbar state: the slide-in search box and the sort order. Search narrows
 * the list by name; sort reorders it. Kept local — these are view preferences,
 * not something to persist.
 */
export function useTagsOptions() {
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [sort, setSort] = useState<TagSort>("name");

    const openSearch = () => setSearchOpen(true);
    const closeSearch = () => {
        setSearchOpen(false);
        setSearch("");
    };

    return {
        searchOpen,
        search,
        setSearch,
        openSearch,
        closeSearch,
        sort,
        setSort,
    };
}

export type TagsOptions = ReturnType<typeof useTagsOptions>;
