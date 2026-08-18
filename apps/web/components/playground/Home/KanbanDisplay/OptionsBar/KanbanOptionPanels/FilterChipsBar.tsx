"use client";
import { format, parseISO } from "date-fns";
import { MdClose } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import { cn } from "@/lib/utils";
import { activeFacetKeys } from "@/lib/kanban/boardFilter";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import {
    DATE_FACET_KEYS,
    LIST_FACET_KEYS,
    type DateFacetKey,
    type FacetKey,
    type ListFacetKey,
} from "@/types/boardFilter";
import { FACET_META, facetSummary, facetValues, useFacetOptions } from "./filterFacets";
import FilterFacetMenu from "./FilterFacetMenu";
import FilterDateMenu from "./FilterDateMenu";
import FilterQueryMenu from "./FilterQueryMenu";

const CHIP = "py-0.5! text-neutral-200";

function isListFacet(key: FacetKey): key is ListFacetKey {
    return (LIST_FACET_KEYS as readonly FacetKey[]).includes(key);
}

function isDateFacet(key: FacetKey): key is DateFacetKey {
    return (DATE_FACET_KEYS as readonly FacetKey[]).includes(key);
}

function ChipLabel({ facetKey, value }: { facetKey: FacetKey; value: string }) {
    const meta = FACET_META[facetKey];
    return (
        <>
            <meta.icon
                className={cn("size-3.5 text-neutral-400", meta.iconClassName)}
                aria-hidden
            />
            <span className="truncate">
                {meta.label}: <span className="text-neutral-100">{value}</span>
            </span>
        </>
    );
}

function ListChip({ facetKey }: { facetKey: ListFacetKey }) {
    const filters = useKanbanFilterStore((s) => s.filters);
    const options = useFacetOptions(facetKey);
    const meta = FACET_META[facetKey];
    const values = facetValues(filters, facetKey);

    return (
        <FilterFacetMenu
            facetKey={facetKey}
            trigger={
                <CapsuleTrigger className={CHIP}>
                    <ChipLabel
                        facetKey={facetKey}
                        value={facetSummary(options, values, meta.plural)}
                    />
                </CapsuleTrigger>
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
            trigger={
                <CapsuleTrigger className={CHIP}>
                    <ChipLabel facetKey={facetKey} value={summary} />
                </CapsuleTrigger>
            }
        />
    );
}

function QueryChip() {
    const query = useKanbanFilterStore((s) => s.filters.query);

    return (
        <FilterQueryMenu
            trigger={
                <CapsuleTrigger className={CHIP}>
                    <ChipLabel facetKey="query" value={query.trim()} />
                </CapsuleTrigger>
            }
        />
    );
}

export default function FilterChipsBar() {
    const filters = useKanbanFilterStore((s) => s.filters);
    const clearFacet = useKanbanFilterStore((s) => s.clearFacet);
    const clearAll = useKanbanFilterStore((s) => s.clearAll);
    const active = activeFacetKeys(filters);

    if (active.length === 0) return null;

    return (
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {active.map((key) => (
                <span key={key} className="inline-flex shrink-0 items-center gap-1">
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
                        className="cursor-pointer text-neutral-400 opacity-70 hover:opacity-100"
                    >
                        <MdClose className="size-2.5" aria-hidden />
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
