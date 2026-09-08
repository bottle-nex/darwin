"use client";
import { CloseIcon } from "@trydarwin/ui/icons";
import { format, parseISO } from "date-fns";
import { type ComponentProps, forwardRef } from "react";

import { Button } from "@/components/ui/button";
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

/**
 * The chip is one pill reading `label | value | ✕`. Only the last two are buttons, so
 * the surface lives on the wrapper and each button is a bare segment inside it.
 * `overflow-hidden` clips the segment hovers to the rounding. Mirrors `IconWrapper`'s
 * solid surface, which models a single control rather than a row of them.
 */
const CHIP_SURFACE =
    "inline-flex h-5 shrink-0 items-center overflow-hidden rounded-sm bg-graphite/70 text-[11px] leading-none ring-[0.5px] ring-white/8";

/** Matches the pill's own `ring-[0.5px]`, so the rules and the border read as one weight. */
const CHIP_DIVIDER = "h-full w-[0.5px] shrink-0 bg-white/8";

const CHIP_PART = "flex h-full items-center gap-1.5 px-2 text-neutral-400";

/** The facet name — it only says what the chip is, so it is not a control. */
const CHIP_LABEL = cn(CHIP_PART, "shrink-0");

/** The current value opens the menu, and highlights on its own hover. */
const CHIP_SEGMENT = cn(
    CHIP_PART,
    "min-w-0 cursor-pointer transition-colors hover:bg-white/8 hover:text-neutral-200",
);

function isListFacet(key: FacetKey): key is ListFacetKey {
    return (LIST_FACET_KEYS as readonly FacetKey[]).includes(key);
}

function isDateFacet(key: FacetKey): key is DateFacetKey {
    return (DATE_FACET_KEYS as readonly FacetKey[]).includes(key);
}

type ChipSegmentProps = ComponentProps<"button">;

/** A clickable part of a chip, highlighting only under its own cursor. */
const ChipSegment = forwardRef<HTMLButtonElement, ChipSegmentProps>(function ChipSegment(
    { className, children, ...props },
    ref,
) {
    return (
        <Button
            variant="unstyled"
            type="button"
            ref={ref}
            className={cn(CHIP_SEGMENT, className)}
            {...props}
        >
            {children}
        </Button>
    );
});

function FacetLabel({ facetKey }: { facetKey: FacetKey }) {
    const meta = FACET_META[facetKey];

    return (
        <span className={CHIP_LABEL}>
            <meta.icon className={cn("size-3.25 shrink-0", meta.iconClassName)} aria-hidden />
            {meta.label}
        </span>
    );
}

function ListChip({ facetKey }: { facetKey: ListFacetKey }) {
    const filters = useKanbanFilterStore((s) => s.filters);
    const options = useFacetOptions(facetKey);
    const meta = FACET_META[facetKey];
    const values = facetValues(filters, facetKey);

    return (
        <>
            <FacetLabel facetKey={facetKey} />
            <span className={CHIP_DIVIDER} aria-hidden />
            <FilterFacetMenu
                facetKey={facetKey}
                trigger={
                    <ChipSegment className="text-neutral-100">
                        <span className="truncate">
                            {facetSummary(options, values, meta.plural)}
                        </span>
                    </ChipSegment>
                }
            />
        </>
    );
}

function DateChip({ facetKey }: { facetKey: DateFacetKey }) {
    const range = useKanbanFilterStore((s) => s.filters[facetKey]);
    const day = (value: string | null) => (value ? format(parseISO(value), "MMM d") : null);
    const from = day(range?.from ?? null);
    const to = day(range?.to ?? null);
    const summary = from && to ? `${from} – ${to}` : from ? `from ${from}` : `until ${to}`;

    return (
        <>
            <FacetLabel facetKey={facetKey} />
            <span className={CHIP_DIVIDER} aria-hidden />
            <FilterDateMenu
                facetKey={facetKey}
                trigger={
                    <ChipSegment className="text-neutral-100">
                        <span className="truncate">{summary}</span>
                    </ChipSegment>
                }
            />
        </>
    );
}

function QueryChip() {
    const query = useKanbanFilterStore((s) => s.filters.query);

    return (
        <>
            <FacetLabel facetKey="query" />
            <span className={CHIP_DIVIDER} aria-hidden />
            <FilterQueryMenu
                trigger={
                    <ChipSegment className="text-neutral-100">
                        <span className="truncate">{query.trim()}</span>
                    </ChipSegment>
                }
            />
        </>
    );
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
                <span key={key} className={CHIP_SURFACE}>
                    {isListFacet(key) ? (
                        <ListChip facetKey={key} />
                    ) : isDateFacet(key) ? (
                        <DateChip facetKey={key} />
                    ) : (
                        <QueryChip />
                    )}
                    <span className={CHIP_DIVIDER} aria-hidden />
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => clearFacet(key)}
                        aria-label={`Remove ${FACET_META[key].label} filter`}
                        className={cn(CHIP_SEGMENT, "px-1.5")}
                    >
                        <CloseIcon className="size-3 shrink-0" aria-hidden />
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
