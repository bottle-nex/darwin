"use client";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import SpaceEditAction from "@/components/playground/space/SpaceEditAction";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";

import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";
import FilterChipsBar from "./KanbanOptionPanels/FilterChipsBar";
import FiltersPanel from "./KanbanOptionPanels/FiltersPanel";
import FocusPanel from "./KanbanOptionPanels/FocusPanel";
import KanbanViewPanel from "./KanbanOptionPanels/KanbanViewPanel";

export default function KanbanOptionsBarFlatKeys() {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    const kanbanView = useKanbanOptionsStore((s) => s.kanbanView);
    const setKanbanView = useKanbanOptionsStore((s) => s.setKanbanView);
    const customColumns = useFilteredCustomColumns();

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-1.5">
                    <PlaygroundBreadcrumb action={<SpaceEditAction />} />

                    <FilterChipsBar />
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-0.75">
                    <FiltersPanel />
                    <FocusPanel value={focus} onChange={setFocus} customColumns={customColumns} />
                    <KanbanViewPanel value={kanbanView} onChange={setKanbanView} />
                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <AddTaskButton />
                </div>
            </PaneActionsSlot>
        </>
    );
}
