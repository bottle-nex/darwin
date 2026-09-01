"use client";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import DisplayPanel from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/DisplayPanel";
import FilterChipsBar from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/FilterChipsBar";
import FiltersPanel from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/FiltersPanel";
import { useIssueView } from "@/hooks/issues/useIssueView";

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
    const view = useIssueView("my-issues");

    return (
        <div className="flex shrink-0 items-center gap-1.5">
            <FiltersPanel crossBoard />
            <DisplayPanel
                layout={view.layout}
                groupBy={view.groupBy}
                groupings={view.groupings}
                onLayoutChange={view.setLayout}
                onGroupByChange={view.setGroupBy}
            />
        </div>
    );
}
