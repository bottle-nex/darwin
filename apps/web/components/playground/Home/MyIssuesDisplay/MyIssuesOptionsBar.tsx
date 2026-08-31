"use client";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import FilterChipsBar from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/FilterChipsBar";
import FiltersPanel from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/FiltersPanel";

export default function MyIssuesOptionsBar({ count }: { count: number }) {
    return (
        <PaneLeadSlot>
            <div className="flex min-w-0 items-center gap-2">
                <PlaygroundBreadcrumb />
                <span className="shrink-0 text-[12px] text-neutral-500">{count}</span>
                <FilterChipsBar />
            </div>
        </PaneLeadSlot>
    );
}

export function MyIssuesControls() {
    return (
        <div className="flex shrink-0 items-center gap-1.5">
            <FiltersPanel crossBoard />
        </div>
    );
}
