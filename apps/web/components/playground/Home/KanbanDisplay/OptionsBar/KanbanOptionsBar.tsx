"use client";
import {
    MdAdd,
    MdGroup,
    MdKeyboardArrowDown,
    MdPlaylistAdd,
    MdSearch,
    MdSettings,
    MdShare,
    MdUpload,
    MdViewColumn,
    MdViewKanban,
} from "react-icons/md";
import { type IconType } from "react-icons";
import { AnimatePresence } from "motion/react";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";
import { useCreateOrEditIssueStore } from "@/store/issues/useCreateOrEditIssueStore";
import type { BoardView } from "@/types/kanban";
import OptionButton from "./KanbanOptionPanels/OptionButton";
import FilterPanel from "./KanbanOptionPanels/FilterPanel";
import TagPanel from "./KanbanOptionPanels/TagPanel";
import SearchBar from "./KanbanOptionPanels/SearchBar";
import SelectedTags from "./KanbanOptionPanels/SelectedTags";
import ViewsPanel from "./KanbanOptionPanels/ViewsPanel";

const TASK_OPTIONS = [
    { id: "issue", label: "New issue", icon: MdAdd },
    { id: "custom_column", label: "Add custom col", icon: MdPlaylistAdd },
    { id: "import", label: "Import issues", icon: MdUpload },
];

const BOARD_VIEWS: { id: BoardView; label: string; icon?: IconType; mascot?: boolean }[] = [
    { id: "default", label: "Default", icon: MdViewColumn },
    { id: "custom", label: "Custom Kanban", icon: MdViewKanban },
    { id: "llm", label: "LLM Kanban", mascot: true },
];

/** Board toolbar: the board switcher, search, tags, filters, Views, and +Task. */
export default function KanbanOptionsBar() {
    const {
        searchOpen,
        search,
        setSearch,
        openSearch,
        closeSearch,
        selectedTagIds,
        toggleTag,
        removeTag,
        clearTags,
        filter,
        setFilter,
        boardView,
        setBoardView,
        kanbanView,
        setKanbanView,
    } = useKanbanOptionsStore();
    const customColumns = useCustomKanbanStore((s) => s.columns);
    const openCreate = useCreateOrEditIssueStore((s) => s.openCreate);
    const setAddColumnOpen = useAddCustomColumnStore((s) => s.setOpen);
    const onAddTask = () => openCreate({ board: "llm" });

    const TASK_OPTION_HANDLERS: Record<string, (() => void) | undefined> = {
        issue: onAddTask,
        custom_column: () => setAddColumnOpen(true),
    };

    return (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <div className="flex min-w-0 items-center gap-1.5">
                <div className="flex shrink-0 items-center gap-0.5">
                    {BOARD_VIEWS.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => setBoardView(v.id)}
                            className={cn(
                                "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors",
                                boardView === v.id
                                    ? "bg-white/10 text-neutral-100"
                                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                            )}
                        >
                            {v.mascot ? (
                                <HeroBuddy move={false} className="size-4" />
                            ) : (
                                v.icon && <v.icon className="size-3.5" aria-hidden />
                            )}
                            {v.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence initial={false}>
                    {searchOpen && (
                        <SearchBar value={search} onChange={setSearch} onClose={closeSearch} />
                    )}
                </AnimatePresence>

                <SelectedTags selected={selectedTagIds} onRemove={removeTag} />
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                <TagPanel selected={selectedTagIds} onToggle={toggleTag} onClear={clearTags} />
                <FilterPanel value={filter} onChange={setFilter} customColumns={customColumns} />
                <TooltipComponent content="Assignees" side="bottom">
                    <OptionButton label="Assignees" icon={MdGroup} />
                </TooltipComponent>
                <TooltipComponent content="Search" side="bottom">
                    <OptionButton
                        label="Search"
                        icon={MdSearch}
                        active={searchOpen}
                        onClick={() => (searchOpen ? closeSearch() : openSearch())}
                    />
                </TooltipComponent>
                <TooltipComponent content="Share" side="bottom">
                    <OptionButton label="Share" icon={MdShare} />
                </TooltipComponent>
                <ViewsPanel value={kanbanView} onChange={setKanbanView} />
                <div className="mx-1 h-4 w-px bg-white/8" />
                <TooltipComponent content="Settings" side="bottom">
                    <OptionButton label="Settings" icon={MdSettings} />
                </TooltipComponent>

                {/* Split button: primary "Add Task" + a chevron that opens a menu. */}
                <div className="ml-1 flex items-center overflow-hidden rounded-sm bg-neutral-100 text-neutral-900">
                    <Button
                        variant="tertiary"
                        type="button"
                        onClick={onAddTask}
                        className="flex h-6 cursor-pointer items-center px-2 text-[11.5px] font-medium hover:bg-black/5 rounded-l-[1px] rounded-r-none"
                    >
                        Add Task
                    </Button>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <Button
                                variant="tertiary"
                                type="button"
                                aria-label="More task options"
                                className="flex h-6 cursor-pointer items-center px-1 hover:bg-black/5 rounded-none"
                            >
                                <MdKeyboardArrowDown className="size-3.5" aria-hidden />
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={6}
                                className="z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                            >
                                {TASK_OPTIONS.map((option) => {
                                    const disabled = option.id === "import";
                                    return (
                                        <DropdownMenu.Item
                                            key={option.id}
                                            disabled={disabled}
                                            onSelect={TASK_OPTION_HANDLERS[option.id]}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none",
                                                disabled
                                                    ? "cursor-not-allowed opacity-40"
                                                    : "cursor-pointer data-highlighted:bg-white/5 data-highlighted:text-neutral-100",
                                            )}
                                        >
                                            <option.icon
                                                className="size-3.5 text-neutral-400"
                                                aria-hidden
                                            />
                                            {option.label}
                                            {disabled && (
                                                <span className="ml-auto text-[10px] text-neutral-500">
                                                    Soon
                                                </span>
                                            )}
                                        </DropdownMenu.Item>
                                    );
                                })}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
            </div>
        </div>
    );
}
