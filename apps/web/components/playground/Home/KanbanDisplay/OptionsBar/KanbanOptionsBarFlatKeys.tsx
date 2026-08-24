"use client";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import FocusPanel from "./KanbanOptionPanels/FocusPanel";
import FiltersPanel from "./KanbanOptionPanels/FiltersPanel";
import FilterChipsBar from "./KanbanOptionPanels/FilterChipsBar";
import BoardViewPanel from "./KanbanOptionPanels/BoardViewPanel";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";

export default function KanbanOptionsBarFlatKeys() {
    const focus = useKanbanOptionsStore((s) => s.focus);
    const setFocus = useKanbanOptionsStore((s) => s.setFocus);
    const kanbanView = useKanbanOptionsStore((s) => s.kanbanView);
    const setKanbanView = useKanbanOptionsStore((s) => s.setKanbanView);
    const boardView = useKanbanOptionsStore((s) => s.boardView);
    const setBoardView = useKanbanOptionsStore((s) => s.setBoardView);
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
                    <FiltersPanel />
                    <FocusPanel value={focus} onChange={setFocus} customColumns={customColumns} />
                    <BoardViewPanel
                        value={boardView}
                        onChange={setBoardView}
                        kanbanView={kanbanView}
                        onKanbanViewChange={setKanbanView}
                    />
                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <AddTaskButton />
                </div>
            </PaneActionsSlot>
        </>
    );
}
