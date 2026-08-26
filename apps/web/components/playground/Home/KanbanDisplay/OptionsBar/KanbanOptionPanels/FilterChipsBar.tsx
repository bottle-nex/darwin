"use client";
import { format, parseISO } from "date-fns";
import { type ComponentProps, forwardRef } from "react";
import { MdClose } from "react-icons/md";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { activeFacetKeys } from "@/lib/kanban/boardFilter";
import { cn } from "@/lib/utils";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import {
    DATE_FACET_KEYS,
    type DateFacetKey,
    type FacetKey,
    LIST_FACET_KEYS,
    type ListFacetKey,
} from "@/types/boardFilter";

import FilterDateMenu from "./FilterDateMenu";
import FilterFacetMenu from "./FilterFacetMenu";
import { FACET_META, facetSummary, facetValues, useFacetOptions } from "./filterFacets";
import FilterQueryMenu from "./FilterQueryMenu";

function isListFacet(key: FacetKey): key is ListFacetKey {
    return (LIST_FACET_KEYS as readonly FacetKey[]).includes(key);
}

function isDateFacet(key: FacetKey): key is DateFacetKey {
    return (DATE_FACET_KEYS as readonly FacetKey[]).includes(key);
}

type FilterChipProps = ComponentProps<"button"> & { facetKey: FacetKey; value: string };

const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
    { facetKey, value, className, ...props },
    ref,
) {
    const meta = FACET_META[facetKey];

    return (
        <Button
            variant="unstyled"
            type="button"
            ref={ref}
            className={cn("group flex shrink-0 cursor-pointer rounded-sm", className)}
            {...props}
        >
            <IconWrapper icon={meta.icon} iconClassName={meta.iconClassName}>
                {meta.label}: <span className="text-neutral-100">{value}</span>
            </IconWrapper>
        </Button>
    );
});

function ListChip({ facetKey }: { facetKey: ListFacetKey }) {
    const filters = useKanbanFilterStore((s) => s.filters);
    const options = useFacetOptions(facetKey);
    const meta = FACET_META[facetKey];
    const values = facetValues(filters, facetKey);

    return (
        <FilterFacetMenu
            facetKey={facetKey}
            trigger={
                <FilterChip
                    facetKey={facetKey}
                    value={facetSummary(options, values, meta.plural)}
                />
            }
        />
    );
}

function DateChip({ facetKey }: { facetKey: DateFacetKey }) {
    const range = useKanbanFilterStore((s) => s.filters[facetKey]);
    const day = (value: string | null) => (value ? format(parseISO(value), "MMM d") : null);
    const from = day(range?.from ?? null);
    const to = day(range?.to ?? null);
    const summary = from && to ? `${from} – ${to}` : from ? `from ${from}` : `until ${to}`;

    return (
        <FilterDateMenu
            facetKey={facetKey}
            trigger={<FilterChip facetKey={facetKey} value={summary} />}
        />
    );
}

function QueryChip() {
    const query = useKanbanFilterStore((s) => s.filters.query);

    return <FilterQueryMenu trigger={<FilterChip facetKey="query" value={query.trim()} />} />;
}

export default function FilterChipsBar() {
    const filters = useKanbanFilterStore((s) => s.filters);
    const clearFacet = useKanbanFilterStore((s) => s.clearFacet);
    const clearAll = useKanbanFilterStore((s) => s.clearAll);
    const active = activeFacetKeys(filters);

    if (active.length === 0) return null;

    return (
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto p-0.5">
            {active.map((key) => (
                <span key={key} className="inline-flex shrink-0 items-center gap-0.5">
                    {isListFacet(key) ? (
                        <ListChip facetKey={key} />
                    ) : isDateFacet(key) ? (
                        <DateChip facetKey={key} />
                    ) : (
                        <QueryChip />
                    )}
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => clearFacet(key)}
                        aria-label={`Remove ${FACET_META[key].label} filter`}
                        className="group shrink-0 cursor-pointer rounded-full"
                    >
                        <IconWrapper
                            icon={MdClose}
                            variant="ghost"
                            className="size-6"
                            iconClassName="size-3"
                        />
                    </Button>
                </span>
            ))}
            {active.length > 1 && (
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={clearAll}
                    className="shrink-0 cursor-pointer bg-transparent text-[11px] font-medium text-neutral-400 hover:text-neutral-100"
                >
                    Clear all
                </Button>
            )}
        </div>
    );
}
