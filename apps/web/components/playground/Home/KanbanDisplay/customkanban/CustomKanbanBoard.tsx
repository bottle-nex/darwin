"use client";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import CustomKanbanColumn from "./CustomKanbanColumn";

export default function CustomKanbanBoard() {
    const columns = useFilteredCustomColumns();

    return (
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
                <CustomKanbanColumn key={column.id} column={column} />
            ))}
        </SortableContext>
    );
}
