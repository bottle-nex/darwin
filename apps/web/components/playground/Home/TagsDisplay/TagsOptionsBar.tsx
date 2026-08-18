"use client";
import { useEffect, useRef } from "react";
import {
    MdAccessTimeFilled,
    MdAdd,
    MdCheck,
    MdClose,
    MdSearch,
    MdSortByAlpha,
} from "react-icons/md";
import { LuArrowUpDown, LuSearch } from "react-icons/lu";
import { AnimatePresence, motion } from "motion/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { useTagsOptionsStore, type TagSort } from "@/store/tags/useTagsOptionsStore";

const SORTS: { id: TagSort; label: string; icon: typeof MdSortByAlpha }[] = [
    { id: "name", label: "Name (A–Z)", icon: MdSortByAlpha },
    { id: "newest", label: "Newest first", icon: MdAccessTimeFilled },
];

type TagsOptionsBarProps = {
    /** Total number of tags in the project (before search). */
    count: number;
    /** Open the create-tag dialog. */
    onCreate: () => void;
};

/** Tags toolbar: count, slide-in search, sort menu, and the New tag button. */
export default function TagsOptionsBar({ count, onCreate }: TagsOptionsBarProps) {
    const { searchOpen, search, setSearch, openSearch, closeSearch, sort, setSort } =
        useTagsOptionsStore();

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[13px] font-medium text-neutral-200">Tags</span>
                    <span className="shrink-0 text-[12px] text-neutral-500">{count}</span>

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
                    <OptionButton
                        label="Search"
                        icon={LuSearch}
                        active={searchOpen}
                        onClick={() => (searchOpen ? closeSearch() : openSearch())}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <OptionButton
                                label="Sort"
                                icon={LuArrowUpDown}
                                active={sort !== "name"}
                            />
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
                                        <MdCheck
                                            className="size-3.5 text-neutral-200"
                                            aria-hidden
                                        />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <Button
                        type="button"
                        variant="tertiary"
                        onClick={onCreate}
                        className="ml-0.5 flex h-6 items-center gap-1 rounded-sm bg-neutral-100 px-2 text-[11.5px] font-medium text-neutral-900 hover:bg-neutral-200"
                    >
                        <MdAdd className="size-3.5 text-neutral-800!" aria-hidden />
                        New tag
                    </Button>
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
            <MdSearch
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
                <MdClose className="size-2.5" aria-hidden />
            </Button>
        </motion.div>
    );
}
