"use client";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import CustomKanbanColumn from "./CustomKanbanColumn";
import type { CustomKanbanApi } from "@/hooks/kanban/useCustomKanban";

export default function CustomKanbanBoard({
    removeColumn,
    renameColumn,
    removeCard,
    assignMember,
    unassignMember,
}: CustomKanbanApi) {
    const columns = useCustomKanbanStore((s) => s.columns);

    return (
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
                <CustomKanbanColumn
                    key={column.id}
                    column={column}
                    onDelete={() => removeColumn(column.id)}
                    onRename={(label) => renameColumn(column.id, label)}
                    onDeleteCard={removeCard}
                    onAssign={assignMember}
                    onUnassign={unassignMember}
                />
            ))}
        </SortableContext>
    );
}
