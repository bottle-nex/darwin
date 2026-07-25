"use client";
import { useEffect, useRef } from "react";
import {
    MdAccessTimeFilled,
    MdAdd,
    MdCheck,
    MdClose,
    MdSearch,
    MdSortByAlpha,
    MdSwapVert,
} from "react-icons/md";
import { AnimatePresence, motion } from "motion/react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
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
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-[13px] font-medium text-neutral-200">Tags</span>
                <span className="shrink-0 text-[12px] text-neutral-500">{count}</span>

                <AnimatePresence initial={false}>
                    {searchOpen && (
                        <TagsSearchBar value={search} onChange={setSearch} onClose={closeSearch} />
                    )}
                </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                <OptionButton
                    label="Search"
                    icon={MdSearch}
                    active={searchOpen}
                    onClick={() => (searchOpen ? closeSearch() : openSearch())}
                />

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <OptionButton label="Sort" icon={MdSwapVert} active={sort !== "name"} />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className="z-50 w-48 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                        >
                            {SORTS.map((option) => (
                                <DropdownMenu.Item
                                    key={option.id}
                                    onSelect={() => setSort(option.id)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none",
                                        "data-highlighted:bg-white/5 data-highlighted:text-neutral-100",
                                    )}
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
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

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
        </div>
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
