"use client";
import { DeleteIcon, FilterIcon } from "@trydarwin/ui/icons";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { activeFacetKeys, hasActiveFilters } from "@/lib/kanban/boardFilter";
import { cn } from "@/lib/utils";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { DATE_FACET_KEYS, type FacetKey, LIST_FACET_KEYS } from "@/types/boardFilter";

import EagerSubmenu from "./EagerSubmenu";
import { FilterDateItems } from "./FilterDateMenu";
import { FilterFacetItems } from "./FilterFacetMenu";
import { FACET_MENU_CONTENT, FACET_META, facetValues } from "./filterFacets";
import { FilterQueryItems } from "./FilterQueryMenu";
import OptionButton from "./OptionButton";

export const FILTERS_PANEL_WIDTH = "w-52";

function FacetRow({ facetKey, count }: { facetKey: FacetKey; count?: number }) {
    const meta = FACET_META[facetKey];
    return (
        <>
            <meta.icon
                className={cn("size-3.5 text-neutral-400", meta.iconClassName)}
                aria-hidden
            />
            <span className="flex-1">{meta.label}</span>
            {count !== undefined && count > 0 && (
                <span className="text-[11px] text-neutral-500">{count}</span>
            )}
        </>
    );
}

/**
 * `crossBoard` offers the Board facet. A column board is already scoped to one
 * board, so filtering to another there would return rows no lane can hold and
 * render empty — only flat lists get it.
 */
export function FiltersPanelItems({ crossBoard = false }: { crossBoard?: boolean }) {
    const filters = useKanbanFilterStore((s) => s.filters);
    const clearAll = useKanbanFilterStore((s) => s.clearAll);
    const active = activeFacetKeys(filters);
    const listFacets = crossBoard
        ? LIST_FACET_KEYS
        : LIST_FACET_KEYS.filter((key) => key !== "spaceIds");

    return (
        <>
            <DropdownMenuLabel>Filter issues</DropdownMenuLabel>

            {listFacets.map((key) => (
                <EagerSubmenu
                    key={key}
                    className={`${FACET_MENU_CONTENT} [direction:ltr]`}
                    trigger={<FacetRow facetKey={key} count={facetValues(filters, key).length} />}
                >
                    <FilterFacetItems facetKey={key} />
                </EagerSubmenu>
            ))}

            <DropdownMenuSeparator />

            {DATE_FACET_KEYS.map((key) => (
                <EagerSubmenu
                    key={key}
                    className="w-auto p-0 [direction:ltr]"
                    trigger={<FacetRow facetKey={key} />}
                >
                    <FilterDateItems facetKey={key} />
                </EagerSubmenu>
            ))}

            <EagerSubmenu
                className="w-60 p-2 [direction:ltr]"
                trigger={<FacetRow facetKey="query" />}
            >
                <FilterQueryItems />
            </EagerSubmenu>

            {active.length > 0 && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={clearAll}>
                        <DeleteIcon className="size-3.5" aria-hidden />
                        <span className="flex-1">Clear all filters</span>
                    </DropdownMenuItem>
                </>
            )}
        </>
    );
}

export default function FiltersPanel({ crossBoard = false }: { crossBoard?: boolean }) {
    const filters = useKanbanFilterStore((s) => s.filters);

    return (
        <DropdownMenu dir="rtl">
            <TooltipComponent delayDuration={1000} content="Filter" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton
                        label="Filter"
                        icon={FilterIcon}
                        active={hasActiveFilters(filters)}
                    />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={`${FILTERS_PANEL_WIDTH} [direction:ltr]`}>
                <FiltersPanelItems crossBoard={crossBoard} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
