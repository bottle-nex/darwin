"use client";
import { SearchIcon } from "@trymatcha/ui/icons";
import type { ReactNode } from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";

export const QUERY_MENU_CONTENT = "w-60 p-2";

export function FilterQueryItems() {
    const query = useKanbanFilterStore((s) => s.filters.query);
    const setFacet = useKanbanFilterStore((s) => s.setFacet);

    return (
        <div className="relative">
            <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500"
                aria-hidden
            />
            <input
                value={query}
                onChange={(e) => setFacet("query", e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Search titles and #numbers..."
                className="h-7 w-full rounded-md border border-white/10 bg-white/5 pr-2 pl-7 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
            />
        </div>
    );
}

export default function FilterQueryMenu({ trigger }: { trigger: ReactNode }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={QUERY_MENU_CONTENT}>
                <FilterQueryItems />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
