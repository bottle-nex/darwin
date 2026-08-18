"use client";
import { useState, type ReactNode } from "react";
import { MdCheck, MdSearch } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import type { ListFacetKey } from "@/types/boardFilter";
import {
    FACET_MENU_CONTENT,
    FACET_META,
    facetValues,
    isSearchableFacet,
    useFacetOptions,
} from "./filterFacets";

export function FilterFacetItems({ facetKey }: { facetKey: ListFacetKey }) {
    const [query, setQuery] = useState("");
    const filters = useKanbanFilterStore((s) => s.filters);
    const setListFacet = useKanbanFilterStore((s) => s.setListFacet);
    const clearFacet = useKanbanFilterStore((s) => s.clearFacet);

    const options = useFacetOptions(facetKey);
    const selected = facetValues(filters, facetKey);
    const meta = FACET_META[facetKey];
    const needle = query.trim().toLowerCase();
    const visible = needle
        ? options.filter((option) => option.label.toLowerCase().includes(needle))
        : options;

    function toggle(value: string) {
        setListFacet(
            facetKey,
            selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value],
        );
    }

    return (
        <>
            <div className="flex shrink-0 flex-col gap-1.5 p-2">
                <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                        {meta.label}
                    </span>
                    {selected.length > 0 && (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => clearFacet(facetKey)}
                            className="cursor-pointer bg-transparent text-[11px] font-medium text-neutral-400 hover:text-neutral-100"
                        >
                            Clear
                        </Button>
                    )}
                </div>
                {isSearchableFacet(facetKey) && (
                    <div className="relative">
                        <MdSearch
                            className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500"
                            aria-hidden
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            placeholder={`Search ${meta.label.toLowerCase()}...`}
                            className="h-7 w-full rounded-md border border-white/10 bg-white/5 pr-2 pl-7 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="h-px shrink-0 bg-white/5" />

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-1">
                {visible.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[12px] text-neutral-600">
                        Nothing to filter by
                    </p>
                ) : (
                    visible.map((option) => {
                        const isOn = selected.includes(option.value);
                        return (
                            <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={isOn}
                                onCheckedChange={() => toggle(option.value)}
                                onSelect={(e) => e.preventDefault()}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-white/5"
                            >
                                <span
                                    className={cn(
                                        "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                                        isOn
                                            ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                                            : "border-white/25",
                                    )}
                                >
                                    {isOn && <MdCheck className="size-2.5" aria-hidden />}
                                </span>
                                {option.dotColor ? (
                                    <TagDisplay name={option.label} color={option.dotColor} />
                                ) : (
                                    <>
                                        {option.icon && (
                                            <option.icon
                                                className={cn(
                                                    "size-3.5 text-neutral-400",
                                                    option.iconClassName,
                                                )}
                                                aria-hidden
                                            />
                                        )}
                                        <span className="flex-1 truncate text-[13px] text-neutral-200">
                                            {option.label}
                                        </span>
                                    </>
                                )}
                            </DropdownMenuCheckboxItem>
                        );
                    })
                )}
            </div>
        </>
    );
}

export default function FilterFacetMenu({
    facetKey,
    trigger,
}: {
    facetKey: ListFacetKey;
    trigger: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={FACET_MENU_CONTENT}>
                <FilterFacetItems facetKey={facetKey} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
