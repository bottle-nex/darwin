"use client";
import AddListForm from "./AddListForm";
import CustomKanbanColumn from "./CustomKanbanColumn";
import type { CustomKanbanApi } from "./useCustomKanban";

export default function CustomKanbanBoard({
    projectId,
    columns,
    addColumn,
    removeColumn,
    renameColumn,
    addCard,
    removeCard,
    editCard,
    assignMember,
    unassignMember,
}: CustomKanbanApi) {
    return (
        <>
            {columns.map((column) => (
                <CustomKanbanColumn
                    key={column.id}
                    column={column}
                    onAddCard={(input) => addCard(column.id, input)}
                    onDelete={() => removeColumn(column.id)}
                    onRename={(label) => renameColumn(column.id, label)}
                    onEditCard={editCard}
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
