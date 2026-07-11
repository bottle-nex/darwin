"use client";
import AddListForm from "./AddListForm";
import CustomKanbanColumn from "./CustomKanbanColumn";
import type { CustomKanbanApi } from "@/hooks/kanban/useCustomKanban";

export default function CustomKanbanBoard({
    projectId,
    columns,
    addColumn,
    removeColumn,
    renameColumn,
    removeCard,
    assignMember,
    unassignMember,
}: CustomKanbanApi) {
    return (
        <>
            {columns.map((column) => (
                <CustomKanbanColumn
                    key={column.id}
                    column={column}
                    onDelete={() => removeColumn(column.id)}
                    onRename={(label) => renameColumn(column.id, label)}
                    onDeleteCard={removeCard}
                    projectId={projectId}
                    onAssign={assignMember}
                    onUnassign={unassignMember}
                />
            ))}
            <AddListForm onAdd={addColumn} />
        </>
    );
}
