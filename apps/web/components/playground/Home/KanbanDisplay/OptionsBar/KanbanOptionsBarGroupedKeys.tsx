"use client";
import {
    MdFilterAlt,
    MdGroup,
    MdKeyboardArrowDown,
    MdKeyboardArrowLeft,
    MdLabel,
    MdSettings,
    MdShare,
    MdTune,
} from "react-icons/md";
import { DropdownMenu } from "radix-ui";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { FilterPanelItems, FILTER_PANEL_WIDTH } from "./KanbanOptionPanels/FilterPanel";
import { TagPanelItems, TAG_PANEL_CONTENT } from "./KanbanOptionPanels/TagPanel";
import { ViewsPanelItems, VIEWS_PANEL_WIDTH } from "./KanbanOptionPanels/ViewsPanel";
import { PANEL_CONTENT, PANEL_ITEM } from "./KanbanOptionPanels/panelStyles";
import SelectedTags from "./KanbanOptionPanels/SelectedTags";
import { AddTaskButton, BoardViewTabs, OPTIONS_BAR_SHELL } from "./KanbanOptionsBarParts";

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
    } = useKanbanOptionsStore();
    const customColumns = useFilteredCustomColumns();

    return (
        <div className={OPTIONS_BAR_SHELL}>
            <div className="flex min-w-0 items-center gap-1.5">
                <BoardViewTabs />

                <SelectedTags selected={selectedTagIds} onRemove={removeTag} />
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                <DropdownMenu.Root dir="rtl">
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            aria-label="Options"
                            className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[12px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                        >
                            <MdTune className="size-3.5" aria-hidden />
                            Options
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className={`w-48 [direction:ltr] ${PANEL_CONTENT}`}
                        >
                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger className={PANEL_ITEM}>
                                    <MdKeyboardArrowLeft
                                        className="size-3.5 text-neutral-500"
                                        aria-hidden
                                    />
                                    <MdLabel className="size-3.5 text-neutral-400" aria-hidden />
                                    <span className="flex-1">Tag</span>
                                    {selectedTagIds.length > 0 && (
                                        <span className="text-[11px] text-neutral-500">
                                            {selectedTagIds.length}
                                        </span>
                                    )}
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.SubContent
                                        sideOffset={6}
                                        className={`[direction:ltr] ${TAG_PANEL_CONTENT}`}
                                    >
                                        <TagPanelItems
                                            selected={selectedTagIds}
                                            onToggle={toggleTag}
                                            onClear={clearTags}
                                        />
                                    </DropdownMenu.SubContent>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Sub>

                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger className={PANEL_ITEM}>
                                    <MdKeyboardArrowLeft
                                        className="size-3.5 text-neutral-500"
                                        aria-hidden
                                    />
                                    <MdFilterAlt
                                        className="size-3.5 text-neutral-400"
                                        aria-hidden
                                    />
                                    <span className="flex-1">Filter</span>
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.SubContent
                                        sideOffset={6}
                                        className={`${FILTER_PANEL_WIDTH} [direction:ltr] ${PANEL_CONTENT}`}
                                    >
                                        <FilterPanelItems
                                            value={filter}
                                            onChange={setFilter}
                                            customColumns={customColumns}
                                        />
                                    </DropdownMenu.SubContent>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Sub>

                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger className={PANEL_ITEM}>
                                    <MdKeyboardArrowLeft
                                        className="size-3.5 text-neutral-500"
                                        aria-hidden
                                    />
                                    <MdTune className="size-3.5 text-neutral-400" aria-hidden />
                                    <span className="flex-1">Views</span>
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.SubContent
                                        sideOffset={6}
                                        className={`${VIEWS_PANEL_WIDTH} [direction:ltr] ${PANEL_CONTENT}`}
                                    >
                                        <ViewsPanelItems
                                            value={kanbanView}
                                            onChange={setKanbanView}
                                        />
                                    </DropdownMenu.SubContent>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Sub>

                            <DropdownMenu.Separator className="my-1 h-px bg-white/5" />

                            <DropdownMenu.Item disabled className={`${PANEL_ITEM} opacity-40`}>
                                <MdGroup className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Assignees</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item disabled className={`${PANEL_ITEM} opacity-40`}>
                                <MdShare className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Share</span>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item disabled className={`${PANEL_ITEM} opacity-40`}>
                                <MdSettings className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Settings</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <AddTaskButton />
            </div>
        </div>
    );
}
