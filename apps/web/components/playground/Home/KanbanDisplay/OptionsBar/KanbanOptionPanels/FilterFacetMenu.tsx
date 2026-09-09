"use client";
import { CheckIcon, SearchIcon } from "@trydarwin/ui/icons";
import { type ReactNode, useState } from "react";

import MemberOptionRow from "@/components/playground/Core/components/MemberOptionRow";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { cn } from "@/lib/utils";
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

    const hasHeader = selected.length > 0 || isSearchableFacet(facetKey);

    return (
        <>
            {hasHeader && (
                <>
                    <div className="flex shrink-0 flex-col gap-1.5 p-1">
                        {selected.length > 0 && (
                            <div className="flex items-center justify-end px-0.5">
                                <Button
                                    variant="unstyled"
                                    type="button"
                                    onClick={() => clearFacet(facetKey)}
                                    className="cursor-pointer bg-transparent text-[11px] font-medium text-neutral-400 hover:text-neutral-100"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                        {isSearchableFacet(facetKey) && (
                            <div className="relative">
                                <SearchIcon
                                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-500"
                                    aria-hidden
                                />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    placeholder={`Search ${meta.label.toLowerCase()}...`}
                                    className="h-7 w-full rounded-md bg-transparent pr-2 pl-7 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="h-px shrink-0 bg-overlay/5" />
                </>
            )}

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
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-overlay/5"
                            >
                                {option.avatarSrc !== undefined ? (
                                    <MemberOptionRow
                                        id={option.value}
                                        label={option.label}
                                        avatarSrc={option.avatarSrc}
                                        checked={isOn}
                                    />
                                ) : (
                                    <>
                                        <span
                                            className={cn(
                                                "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                                                isOn
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-overlay/25",
                                            )}
                                        >
                                            {isOn && <CheckIcon className="size-2.5" aria-hidden />}
                                        </span>
                                        {option.dotColor ? (
                                            <TagDisplay
                                                name={option.label}
                                                color={option.dotColor}
                                            />
                                        ) : (
                                            <>
                                                {option.iconPick ? (
                                                    <IconPickGlyph
                                                        pick={option.iconPick}
                                                        className="size-3.5 shrink-0"
                                                    />
                                                ) : (
                                                    option.icon && (
                                                        <option.icon
                                                            className={cn(
                                                                "size-3.5 shrink-0 text-neutral-400",
                                                                option.iconClassName,
                                                            )}
                                                            aria-hidden
                                                        />
                                                    )
                                                )}
                                                <span className="flex-1 truncate text-[13px] text-neutral-200">
                                                    {option.label}
                                                </span>
                                            </>
                                        )}
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
