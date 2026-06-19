"use client";
import AddListForm from "./AddListForm";
import CustomKanbanColumn from "./CustomKanbanColumn";
import type { CustomKanbanApi } from "./useCustomKanban";

/**
 * The Trello-style board the user builds by hand: the columns they create
 * (each holding cards added through the modal) followed by an "Add list"
 * affordance. Rendered as bare flex children so the caller can place it in the
 * same scroll row as the LLM board for one continuous left-to-right board.
 */
export default function CustomKanbanBoard({
    columns,
    addColumn,
    removeColumn,
    addCard,
}: CustomKanbanApi) {
    return (
        <>
            {columns.map((column) => (
                <CustomKanbanColumn
                    key={column.id}
                    column={column}
                    onAddCard={(input) => addCard(column.id, input)}
                    onDelete={() => removeColumn(column.id)}
                />
            ))}
            <AddListForm onAdd={addColumn} />
        </>
    );
}
