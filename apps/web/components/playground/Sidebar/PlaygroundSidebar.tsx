"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MdKeyboardDoubleArrowLeft, MdSearch } from "react-icons/md";
import { RailSurface } from "../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { getSurfaceNavRows, SURFACE_TITLES } from "./surfaceConfig";
import type { SidebarSectionProps } from "./shared";
import SidebarHeaderIcon from "./SidebarHeaderIcon";
import SidebarSearch from "./SidebarSearch";
import HomeSidebar from "../Home/HomeSidebar/HomeSidebar";
import ProjectsSidebar from "../Projects/projectsidebar/ProjectsSidebar";
import PullRequestsSidebar from "../PullRequests/PullRequestsSidebar/PullRequestsSidebar";
import AgentsSidebar from "../Agents/agentsidebar/AgentsSidebar";
import WorkersSidebar from "../Workers/WorkersSidebar/WorkersSidebar";
import MoreSidebar from "../More/MoreSidebar/MoreSidebar";

type PlaygroundSidebarProps = {
    surface: RailSurface;
    onCollapse: () => void;
};

/** Renders the active surface's sidebar sections. */
function SidebarRenderer({ surface, ...section }: { surface: RailSurface } & SidebarSectionProps) {
    switch (surface) {
        case RailSurface.Home:
            return <HomeSidebar {...section} />;
        case RailSurface.Projects:
            return <ProjectsSidebar {...section} />;
        case RailSurface.PullRequests:
            return <PullRequestsSidebar {...section} />;
        case RailSurface.Agents:
            return <AgentsSidebar {...section} />;
        case RailSurface.Workers:
            return <WorkersSidebar {...section} />;
        case RailSurface.More:
            return <MoreSidebar />;
    }
}

/**
 * Shared sidebar shell: header (title, search, collapse) + the active surface's
 * sections. The committed active tab lives in the central nav store (so it is
 * remembered per surface); a transient `highlightId` drives keyboard search
 * navigation and only commits to the store on Enter or click.
 */
export default function PlaygroundSidebar({ surface, onCollapse }: PlaygroundSidebarProps) {
    const committedTab = usePlaygroundNavStore((s) => s.tabBySurface[surface]);
    const setTab = usePlaygroundNavStore((s) => s.setTab);

    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [highlightId, setHighlightId] = useState<string | null>(null);

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchQuery("");
        setHighlightId(null);
    };

    // Flat list of rows matching the query in the active surface — drives
    // arrow-key navigation through the filtered results.
    const navRows = useMemo(() => getSurfaceNavRows(surface, searchQuery), [surface, searchQuery]);

    // While searching, the highlight falls back to the first match so Enter
    // always has a target. The active-row styling tracks the highlight during
    // search and the committed tab otherwise.
    const effectiveHighlight =
        searchOpen && navRows.length > 0
            ? navRows.some((r) => r.id === highlightId)
                ? highlightId
                : navRows[0].id
            : null;
    const activeRowId = effectiveHighlight ?? committedTab;

    const moveHighlight = (delta: number) => {
        if (navRows.length === 0) return;
        const current = navRows.findIndex((r) => r.id === effectiveHighlight);
        const next =
            current === -1
                ? delta > 0
                    ? 0
                    : navRows.length - 1
                : Math.min(Math.max(current + delta, 0), navRows.length - 1);
        setHighlightId(navRows[next].id);
    };

    const openHighlighted = () => {
        if (effectiveHighlight) setTab(surface, effectiveHighlight);
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
                            <MdSearch className="size-3.5" aria-hidden />
                        </SidebarHeaderIcon>
                        <SidebarHeaderIcon label="Collapse sidebar" onClick={onCollapse}>
                            <MdKeyboardDoubleArrowLeft className="size-3.5" aria-hidden />
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
                <div className="peer flex flex-col">
                    <SidebarRenderer
                        surface={surface}
                        selectedRowId={activeRowId}
                        onSelect={(id) => setTab(surface, id)}
                        query={searchQuery}
                    />
                </div>
                {searchQuery.trim() && (
                    <p className="hidden truncate px-2 py-8 text-center text-[12px] text-neutral-500 peer-empty:block">
                        No matches for &ldquo;{searchQuery.trim()}&rdquo;
                    </p>
                )}
            </div>
        </aside>
    );
}
