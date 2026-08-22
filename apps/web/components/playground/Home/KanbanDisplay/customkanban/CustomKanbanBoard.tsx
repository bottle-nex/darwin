"use client";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import CustomKanbanColumn from "./CustomKanbanColumn";

export default function CustomKanbanBoard() {
    const columns = useFilteredCustomColumns();
    const loadedIssueIds = useMemo(
        () => columns.flatMap((column) => column.cards.map((card) => card.id)),
        [columns],
    );

    return (
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
                {columns.map((column) => (
                    <CustomKanbanColumn key={column.id} column={column} />
                ))}
            </IssueSelectionOrderProvider>
        </SortableContext>
    );
}
