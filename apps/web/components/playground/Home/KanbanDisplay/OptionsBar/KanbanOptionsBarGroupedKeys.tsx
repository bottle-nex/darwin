"use client";
import {
    BoardViewIcon,
    FilterIcon,
    KanbanColumnsIcon,
    OptionsMenuIcon,
    SettingsIcon,
    ShareIcon,
} from "@trydarwin/ui/icons";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIssueView } from "@/hooks/issues/useIssueView";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { activeFacetKeys } from "@/lib/kanban/boardFilter";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardScope } from "@/types/board";

import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";
import { DISPLAY_PANEL_WIDTH, DisplayPanelItems } from "./KanbanOptionPanels/DisplayPanel";
import EagerSubmenu from "./KanbanOptionPanels/EagerSubmenu";
import FilterChipsBar from "./KanbanOptionPanels/FilterChipsBar";
import { FILTERS_PANEL_WIDTH, FiltersPanelItems } from "./KanbanOptionPanels/FiltersPanel";
import { FOCUS_PANEL_WIDTH, FocusPanelItems } from "./KanbanOptionPanels/FocusPanel";

/**
 * Every toolbar option collapsed behind one "Options" menu. The panels that have
 * their own rows (filter, focus, views) become submenus; the rest are plain items.
 *
 * `dir="rtl"` on the root makes those flyouts open to the *left*, matching the
 * standalone FocusPanel — see its comment for why the content is forced back to
 * `[direction:ltr]`.
 */
export default function KanbanOptionsBarGroupedKeys({ scope }: { scope: BoardScope }) {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    const view = useIssueView(scope);
    const filters = useKanbanFilterStore((s) => s.filters);
    const customColumns = useFilteredCustomColumns();
    const activeCount = activeFacetKeys(filters).length;

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-1.5">
                    <PlaygroundBreadcrumb />

                    <FilterChipsBar />
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-1.5">
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label="Options"
                                className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                            >
                                <OptionsMenuIcon className="size-4" aria-hidden />
                                Options
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 [direction:ltr]">
                            <>
                                <EagerSubmenu
                                    className={`${FILTERS_PANEL_WIDTH} [direction:ltr]`}
                                    trigger={
                                        <>
                                            <FilterIcon
                                                className="size-3.5 text-neutral-400"
                                                aria-hidden
                                            />
                                            <span className="flex-1">Filter</span>
                                            {activeCount > 0 && (
                                                <span className="text-[11px] text-neutral-500">
                                                    {activeCount}
                                                </span>
                                            )}
                                        </>
                                    }
                                >
                                    <FiltersPanelItems crossBoard={view.layout === "list"} />
                                </EagerSubmenu>

                                <EagerSubmenu
                                    className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}
                                    trigger={
                                        <>
                                            <KanbanColumnsIcon
                                                className="size-3.5 text-neutral-400"
                                                aria-hidden
                                            />
                                            <span className="flex-1">Focus</span>
                                        </>
                                    }
                                >
                                    <FocusPanelItems
                                        value={focus}
                                        onChange={setFocus}
                                        customColumns={customColumns}
                                    />
                                </EagerSubmenu>

                                <EagerSubmenu
                                    className={`${DISPLAY_PANEL_WIDTH} [direction:ltr]`}
                                    trigger={
                                        <>
                                            <BoardViewIcon
                                                className="size-3.5 text-neutral-400"
                                                aria-hidden
                                            />
                                            <span className="flex-1">Display</span>
                                        </>
                                    }
                                >
                                    <DisplayPanelItems
                                        layout={view.layout}
                                        groupBy={view.groupBy}
                                        groupings={view.groupings}
                                        onLayoutChange={view.setLayout}
                                        onGroupByChange={view.setGroupBy}
                                    />
                                </EagerSubmenu>
                            </>

                            <DropdownMenuSeparator className="my-1 h-px bg-white/5" />

                            <DropdownMenuItem disabled>
                                <ShareIcon className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Share</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem disabled>
                                <SettingsIcon className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Settings</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <AddTaskButton />
                </div>
            </PaneActionsSlot>
        </>
    );
}
