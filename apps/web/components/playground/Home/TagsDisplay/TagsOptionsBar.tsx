"use client";
import {
    AddIcon,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    DeleteIcon,
    EditIcon,
    SearchIcon,
    SearchToggleIcon,
    SortAlphabeticalIcon,
    SortIcon,
} from "@trymatcha/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type TagSort, useTagsOptionsStore } from "@/store/tags/useTagsOptionsStore";

const SORTS: { id: TagSort; label: string; icon: typeof SortAlphabeticalIcon }[] = [
    { id: "name", label: "Name (A–Z)", icon: SortAlphabeticalIcon },
    { id: "newest", label: "Newest first", icon: ClockIcon },
];

type TagsOptionsBarProps = {
    /** Total number of tags in the project (before search). */
    count: number;
    /** Open the create-tag dialog. */
    onCreate: () => void;
    /** How many rows are checked in the list. */
    selectedCount: number;
    /** Edit the single checked tag. */
    onEditSelected: () => void;
    /** Delete every checked tag. */
    onDeleteSelected: () => void;
    /** Uncheck every row. */
    onClearSelection: () => void;
};

/** Tags toolbar: count, slide-in search, sort menu, and the New tag button. */
export default function TagsOptionsBar({
    count,
    onCreate,
    selectedCount,
    onEditSelected,
    onDeleteSelected,
    onClearSelection,
}: TagsOptionsBarProps) {
    const { searchOpen, search, setSearch, openSearch, closeSearch, sort, setSort } =
        useTagsOptionsStore();

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-2">
                    <PlaygroundBreadcrumb />
                    <span className="shrink-0 text-[12px] text-neutral-500">
                        {selectedCount ? `${selectedCount} selected` : count}
                    </span>

                    <AnimatePresence initial={false}>
                        {searchOpen && (
                            <TagsSearchBar
                                value={search}
                                onChange={setSearch}
                                onClose={closeSearch}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-1.5">
                    {selectedCount === 1 && (
                        <OptionButton label="Edit tag" icon={EditIcon} onClick={onEditSelected} />
                    )}

                    {selectedCount > 0 && (
                        <>
                            <OptionButton
                                label="Delete tag"
                                icon={DeleteIcon}
                                onClick={onDeleteSelected}
                            />
                            <OptionButton
                                label="Clear selection"
                                icon={CloseIcon}
                                onClick={onClearSelection}
                            />
                            <div className="mx-1 h-4 w-px bg-white/8" />
                        </>
                    )}

                    <OptionButton
                        label="Search"
                        icon={SearchToggleIcon}
                        active={searchOpen}
                        onClick={() => (searchOpen ? closeSearch() : openSearch())}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <OptionButton label="Sort" icon={SortIcon} active={sort !== "name"} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {SORTS.map((option) => (
                                <DropdownMenuItem
                                    key={option.id}
                                    onSelect={() => setSort(option.id)}
                                    className={undefined}
                                >
                                    <option.icon
                                        className="size-3.5 text-neutral-400"
                                        aria-hidden
                                    />
                                    <span className="flex-1">{option.label}</span>
                                    {sort === option.id && (
                                        <CheckIcon
                                            className="size-3.5 text-neutral-200"
                                            aria-hidden
                                        />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <OptionButton label="New tag" icon={AddIcon} onClick={onCreate} />
                </div>
            </PaneActionsSlot>
        </>
    );
}

type TagsSearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
};

/** Search field that slides in beside the toolbar's left edge. Esc closes it. */
function TagsSearchBar({ value, onChange, onClose }: TagsSearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex shrink-0 items-center overflow-hidden"
        >
            <SearchIcon
                className="pointer-events-none absolute left-2.5 size-3.5 text-neutral-500"
                aria-hidden
            />
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                }}
                placeholder="Search tags..."
                className="h-7 w-full rounded-md border border-white/10 bg-white/5 pr-7 pl-8 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
            />
            <Button
                variant="unstyled"
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="absolute right-1.5 flex size-4 cursor-pointer items-center justify-center rounded-full bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-neutral-100"
            >
                <CloseIcon className="size-2.5" aria-hidden />
            </Button>
        </motion.div>
    );
}
