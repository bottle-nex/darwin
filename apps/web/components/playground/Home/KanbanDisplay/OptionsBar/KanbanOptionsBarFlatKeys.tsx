"use client";
import { MdGroup, MdSettings, MdShare } from "react-icons/md";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import OptionButton from "./KanbanOptionPanels/OptionButton";
import FilterPanel from "./KanbanOptionPanels/FilterPanel";
import TagPanel from "./KanbanOptionPanels/TagPanel";
import SelectedTags from "./KanbanOptionPanels/SelectedTags";
import ViewsPanel from "./KanbanOptionPanels/ViewsPanel";
import { AddTaskButton, BoardViewTabs, OPTIONS_BAR_SHELL } from "./KanbanOptionsBarParts";

export default function KanbanOptionsBarFlatKeys() {
    const {
        selectedTagIds,
        toggleTag,
        removeTag,
        clearTags,
        filter,
        setFilter,
        kanbanView,
        setKanbanView,
    } = useKanbanOptionsStore();
    const customColumns = useFilteredCustomColumns();

    return (
        <div className={OPTIONS_BAR_SHELL}>
            <div className="flex min-w-0 items-center gap-1.5">
                <BoardViewTabs />

                <SelectedTags selected={selectedTagIds} onRemove={removeTag} />
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                <TagPanel selected={selectedTagIds} onToggle={toggleTag} onClear={clearTags} />
                <FilterPanel value={filter} onChange={setFilter} customColumns={customColumns} />
                <TooltipComponent delayDuration={1000} content="Assignees" side="bottom">
                    <OptionButton label="Assignees" icon={MdGroup} />
                </TooltipComponent>
                <TooltipComponent delayDuration={1000} content="Share" side="bottom">
                    <OptionButton label="Share" icon={MdShare} />
                </TooltipComponent>
                <ViewsPanel value={kanbanView} onChange={setKanbanView} />
                <div className="mx-1 h-4 w-px bg-white/8" />
                <TooltipComponent delayDuration={1000} content="Settings" side="bottom">
                    <OptionButton label="Settings" icon={MdSettings} />
                </TooltipComponent>

                <AddTaskButton />
            </div>
        </div>
    );
}
