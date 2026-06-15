"use client";
import {
    ChevronDown,
    Kanban,
    List,
    Plus,
    Search,
    Settings,
    Settings2,
    Share2,
    Upload,
    Users,
    type LucideIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { KanbanOptions } from "./useKanbanOptions";
import type { KanbanView } from "./types";
import OptionButton from "./KanbanOptionPanels/OptionButton";
import FilterPanel from "./KanbanOptionPanels/FilterPanel";
import LabelPanel from "./KanbanOptionPanels/LabelPanel";
import SearchBar from "./KanbanOptionPanels/SearchBar";
import SelectedLabels from "./KanbanOptionPanels/SelectedLabels";

const VIEWS: { id: KanbanView; label: string; icon: LucideIcon }[] = [
    { id: "board", label: "Board", icon: Kanban },
    { id: "list", label: "List", icon: List },
];

const TASK_OPTIONS = [
    { id: "issue", label: "New issue", icon: Plus },
    { id: "import", label: "Import issues", icon: Upload },
];

type KanbanOptionsBarProps = {
    options: KanbanOptions;
    view: KanbanView;
    onViewChange: (view: KanbanView) => void;
};

/** Board toolbar: Board/List toggle, search, labels, filters, share, and +Task. */
export default function KanbanOptionsBar({ options, view, onViewChange }: KanbanOptionsBarProps) {
    const {
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
    } = options;

    return (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <div className="flex min-w-0 items-center gap-1.5">
                <div className="flex shrink-0 items-center gap-0.5">
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => onViewChange(v.id)}
                            className={cn(
                                "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors",
                                view === v.id
                                    ? "bg-white/10 text-neutral-100"
                                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                            )}
                        >
                            <v.icon className="size-3.5" aria-hidden />
                            {v.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence initial={false}>
                    {searchOpen && (
                        <SearchBar value={search} onChange={setSearch} onClose={closeSearch} />
                    )}
                </AnimatePresence>

                <SelectedLabels selected={selectedLabels} onRemove={removeLabel} />
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                <LabelPanel
                    selected={selectedLabels}
                    onToggle={toggleLabel}
                    onClear={clearLabels}
                />
                <FilterPanel value={filter} onChange={setFilter} />
                <OptionButton label="Assignees" icon={Users} />
                <OptionButton
                    label="Search"
                    icon={Search}
                    active={searchOpen}
                    onClick={() => (searchOpen ? closeSearch() : openSearch())}
                />
                <OptionButton label="Share" icon={Share2} />
                <OptionButton label="Board settings" icon={Settings2} />
                <div className="mx-1 h-4 w-px bg-white/8" />
                <OptionButton label="Settings" icon={Settings} />

                {/* Split button: primary "Add Task" + a chevron that opens a menu. */}
                <div className="ml-1 flex items-center overflow-hidden rounded-sm bg-neutral-100 text-neutral-900">
                    <Button
                        variant="tertiary"
                        type="button"
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
                                <ChevronDown className="size-3.5" aria-hidden />
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={6}
                                className="z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                            >
                                {TASK_OPTIONS.map((option) => (
                                    <DropdownMenu.Item
                                        key={option.id}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none",
                                            "data-highlighted:bg-white/5 data-highlighted:text-neutral-100",
                                        )}
                                    >
                                        <option.icon
                                            className="size-3.5 text-neutral-400"
                                            aria-hidden
                                        />
                                        {option.label}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
            </div>
        </div>
    );
}
