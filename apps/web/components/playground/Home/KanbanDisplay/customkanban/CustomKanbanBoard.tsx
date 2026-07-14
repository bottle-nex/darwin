"use client";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";
import AddListForm from "./AddListForm";
import CustomKanbanColumn from "./CustomKanbanColumn";
import type { CustomKanbanApi } from "@/hooks/kanban/useCustomKanban";

export default function CustomKanbanBoard({
    addColumn,
    removeColumn,
    renameColumn,
    removeCard,
    assignMember,
    unassignMember,
}: CustomKanbanApi) {
    const columns = useCustomKanbanStore((s) => s.columns);

    return (
        <>
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
            <AddListForm onAdd={addColumn} />
        </>
    );
}
