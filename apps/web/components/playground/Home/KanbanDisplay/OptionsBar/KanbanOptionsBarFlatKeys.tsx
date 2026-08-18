"use client";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import FilterPanel from "./KanbanOptionPanels/FilterPanel";
import SelectedTags from "./KanbanOptionPanels/SelectedTags";
import ViewsPanel from "./KanbanOptionPanels/ViewsPanel";
import BoardViewPanel from "./KanbanOptionPanels/BoardViewPanel";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import AddTaskButton from "./KanbanOptionPanels/AddTaskButton";

export default function KanbanOptionsBarFlatKeys() {
    const {
        selectedTagIds,
        removeTag,
        filter,
        setFilter,
        kanbanView,
        setKanbanView,
        boardView,
        setBoardView,
    } = useKanbanOptionsStore();
    const customColumns = useFilteredCustomColumns();

    return (
        <>
            <PaneLeadSlot>
                <div className="flex min-w-0 items-center gap-1.5">
                    <PlaygroundBreadcrumb />

                    <SelectedTags selected={selectedTagIds} onRemove={removeTag} />
                </div>
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-0.75">
                    <FilterPanel
                        value={filter}
                        onChange={setFilter}
                        customColumns={customColumns}
                    />
                    <BoardViewPanel value={boardView} onChange={setBoardView} />
                    <ViewsPanel value={kanbanView} onChange={setKanbanView} />
                    <div className="mx-1 h-4 w-px bg-white/8" />

                    <AddTaskButton />
                </div>
            </PaneActionsSlot>
        </>
    );
}
