"use client";
import { Button } from "@/components/ui/button";
import {
    LuChevronLeft,
    LuEye,
    LuListFilter,
    LuSettings,
    LuShare2,
    LuSlidersHorizontal,
    LuTag,
    LuUsers,
} from "react-icons/lu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { FilterPanelItems, FILTER_PANEL_WIDTH } from "./KanbanOptionPanels/FilterPanel";
import { TagPanelItems, TAG_PANEL_CONTENT } from "./KanbanOptionPanels/TagPanel";
import { ViewsPanelItems, VIEWS_PANEL_WIDTH } from "./KanbanOptionPanels/ViewsPanel";
import { BoardViewPanelItems, BOARD_VIEW_PANEL_WIDTH } from "./KanbanOptionPanels/BoardViewPanel";
import SelectedTags from "./KanbanOptionPanels/SelectedTags";
import { PANE_BAR_SHELL } from "@/components/playground/Core/components/paneBar";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";

/**
 * Every toolbar option collapsed behind one "Options" menu. The panels that have
 * their own rows (tag, filter, views) become submenus; the rest are plain items.
 *
 * `dir="rtl"` on the root makes those flyouts open to the *left*, matching the
 * standalone FilterPanel — see its comment for why the content is forced back to
 * `[direction:ltr]`.
 */
export default function KanbanOptionsBarGroupedKeys() {
    const {
        selectedTagIds,
        toggleTag,
        removeTag,
        clearTags,
        filter,
        setFilter,
        kanbanView,
        setKanbanView,
        boardView,
        setBoardView,
    } = useKanbanOptionsStore();
    const customColumns = useFilteredCustomColumns();

    return (
        <div className={PANE_BAR_SHELL}>
            <div className="flex min-w-0 items-center gap-1.5">
                <PlaygroundBreadcrumb />

                <SelectedTags selected={selectedTagIds} onRemove={removeTag} />
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Options"
                            className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                        >
                            <LuSlidersHorizontal className="size-3.5" aria-hidden />
                            Options
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 [direction:ltr]">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <LuChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                                <LuTag className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Tag</span>
                                {selectedTagIds.length > 0 && (
                                    <span className="text-[11px] text-neutral-500">
                                        {selectedTagIds.length}
                                    </span>
                                )}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                className={`[direction:ltr] ${TAG_PANEL_CONTENT}`}
                            >
                                <TagPanelItems
                                    selected={selectedTagIds}
                                    onToggle={toggleTag}
                                    onClear={clearTags}
                                />
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <LuChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                                <LuListFilter className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Filter</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                className={`${FILTER_PANEL_WIDTH} [direction:ltr]`}
                            >
                                <FilterPanelItems
                                    value={filter}
                                    onChange={setFilter}
                                    customColumns={customColumns}
                                />
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <LuChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                                <LuEye className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Board</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                className={`${BOARD_VIEW_PANEL_WIDTH} [direction:ltr]`}
                            >
                                <BoardViewPanelItems value={boardView} onChange={setBoardView} />
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <LuChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                                <LuSlidersHorizontal
                                    className="size-3.5 text-neutral-400"
                                    aria-hidden
                                />
                                <span className="flex-1">Views</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                                className={`${VIEWS_PANEL_WIDTH} [direction:ltr]`}
                            >
                                <ViewsPanelItems value={kanbanView} onChange={setKanbanView} />
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator className="my-1 h-px bg-white/5" />

                        <DropdownMenuItem disabled>
                            <LuUsers className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Assignees</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem disabled>
                            <LuShare2 className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Share</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem disabled>
                            <LuSettings className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="mx-1 h-4 w-px bg-white/8" />

                <AddTaskButton />
            </div>
        </div>
    );
}
