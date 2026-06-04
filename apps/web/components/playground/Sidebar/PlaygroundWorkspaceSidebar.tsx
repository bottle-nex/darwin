"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsLeft, Search } from "lucide-react";
import type { RailSurface } from "../IconRail/railSurface";
import { getSurfaceNavRows, PlaygroundSidebarSurface, SURFACE_TITLES } from "./surfaces";
import SidebarHeaderIcon from "./SidebarHeaderIcon";
import SidebarSearch from "./SidebarSearch";

type PlaygroundWorkspaceSidebarProps = {
    surface: RailSurface;
    onCollapse: () => void;
};

export default function PlaygroundWorkspaceSidebar({
    surface,
    onCollapse,
}: PlaygroundWorkspaceSidebarProps) {
    const [selectedRowId, setSelectedRowId] = useState<string>("inbox");
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery("");
    };

    // Flat list of rows matching the query in the active surface — drives
    // arrow-key navigation through the filtered results.
    const navRows = useMemo(() => getSurfaceNavRows(surface, searchQuery), [surface, searchQuery]);

    // The highlighted row. While searching, fall back to the first match so
    // Enter always has a target — derived (not stored) to stay in sync.
    const highlightedId =
        searchOpen && !navRows.some((r) => r.id === selectedRowId)
            ? (navRows[0]?.id ?? selectedRowId)
            : selectedRowId;

    const moveHighlight = (delta: number) => {
        if (navRows.length === 0) return;
        const current = navRows.findIndex((r) => r.id === highlightedId);
        const next =
            current === -1
                ? delta > 0
                    ? 0
                    : navRows.length - 1
                : Math.min(Math.max(current + delta, 0), navRows.length - 1);
        setSelectedRowId(navRows[next].id);
    };

    const openHighlighted = () => {
        setSelectedRowId(highlightedId);
        closeSearch();
    };

    return (
        <aside
            data-lenis-prevent
            className="flex h-full min-h-0 w-60 shrink-0 flex-col border-r border-white/5 bg-charcoal overflow-y-auto"
        >
            <div className="relative flex h-12 items-center px-2">
                <div className="flex w-full items-center justify-between gap-1">
                    <h1 className="px-1 text-[14px] font-semibold text-neutral-100">
                        {SURFACE_TITLES[surface]}
                    </h1>
                    <div className="flex items-center">
                        <SidebarHeaderIcon label="Search" onClick={() => setSearchOpen(true)}>
                            <Search className="size-3.5" aria-hidden />
                        </SidebarHeaderIcon>
                        <SidebarHeaderIcon label="Collapse sidebar" onClick={onCollapse}>
                            <ChevronsLeft className="size-3.5" aria-hidden />
                        </SidebarHeaderIcon>
                    </div>
                </div>

                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, width: "20%" }}
                            animate={{ opacity: 1, width: "calc(100% - 1rem)" }}
                            exit={{ opacity: 0, width: "20%" }}
                            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute inset-y-0 right-2 z-10 flex items-center bg-charcoal"
                        >
                            <SidebarSearch
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClose={closeSearch}
                                onArrowDown={() => moveHighlight(1)}
                                onArrowUp={() => moveHighlight(-1)}
                                onEnter={openHighlighted}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                <PlaygroundSidebarSurface
                    surface={surface}
                    selectedRowId={highlightedId}
                    onSelect={setSelectedRowId}
                    query={searchQuery}
                />
            </div>
        </aside>
    );
}
