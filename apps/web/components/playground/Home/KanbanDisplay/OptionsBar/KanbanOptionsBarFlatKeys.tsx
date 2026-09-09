"use client";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { useIssueView } from "@/hooks/issues/useIssueView";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import type { BoardScope } from "@/types/board";

import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";
import DisplayPanel from "./KanbanOptionPanels/DisplayPanel";
import FilterChipsBar from "./KanbanOptionPanels/FilterChipsBar";
import FiltersPanel from "./KanbanOptionPanels/FiltersPanel";
import FocusPanel from "./KanbanOptionPanels/FocusPanel";

export default function KanbanOptionsBarFlatKeys({ scope }: { scope: BoardScope }) {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    const view = useIssueView(scope);
    const customColumns = useFilteredCustomColumns();

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-1.5">
                    <PlaygroundBreadcrumb />

                    <FilterChipsBar />
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-0.75">
                    <FiltersPanel crossBoard={view.layout === "list"} />
                    <FocusPanel value={focus} onChange={setFocus} customColumns={customColumns} />
                    <DisplayPanel
                        layout={view.layout}
                        groupBy={view.groupBy}
                        groupings={view.groupings}
                        onLayoutChange={view.setLayout}
                        onGroupByChange={view.setGroupBy}
                    />
                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <AddTaskButton />
                </div>
            </PaneActionsSlot>
        </>
    );
}
