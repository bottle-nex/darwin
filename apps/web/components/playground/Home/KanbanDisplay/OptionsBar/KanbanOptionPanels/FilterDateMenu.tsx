"use client";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import type { DateFacetKey } from "@/types/boardFilter";
import { FACET_META } from "./filterFacets";

export const DATE_MENU_CONTENT = "w-auto p-0";

const DAY_FORMAT = "yyyy-MM-dd";

export function FilterDateItems({ facetKey }: { facetKey: DateFacetKey }) {
    const filters = useKanbanFilterStore((s) => s.filters);
    const setFacet = useKanbanFilterStore((s) => s.setFacet);
    const clearFacet = useKanbanFilterStore((s) => s.clearFacet);

    const range = filters[facetKey];
    const meta = FACET_META[facetKey];
    const selected: DateRange | undefined = range
        ? {
              from: range.from ? parseISO(range.from) : undefined,
              to: range.to ? parseISO(range.to) : undefined,
          }
        : undefined;

    function select(next: DateRange | undefined) {
        if (!next?.from && !next?.to) {
            clearFacet(facetKey);
            return;
        }
        setFacet(facetKey, {
            from: next.from ? format(next.from, DAY_FORMAT) : null,
            to: next.to ? format(next.to, DAY_FORMAT) : null,
        });
    }

    return (
        <>
            <div className="flex shrink-0 items-center justify-between gap-4 px-2.5 py-2">
                <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                    {meta.label}
                </span>
                {range && (
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
            <div className="h-px shrink-0 bg-white/5" />
            <Calendar mode="range" selected={selected} onSelect={select} />
        </>
    );
}

export default function FilterDateMenu({
    facetKey,
    trigger,
}: {
    facetKey: DateFacetKey;
    trigger: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={DATE_MENU_CONTENT}>
                <FilterDateItems facetKey={facetKey} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
