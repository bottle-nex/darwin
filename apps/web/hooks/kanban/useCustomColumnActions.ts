"use client";
import { useCreateColumn } from "@/hooks/issues/useCreateColumn";
import { useDeleteColumn } from "@/hooks/issues/useDeleteColumn";
import { useUpdateColumn } from "@/hooks/issues/useUpdateColumn";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/lib/toast";
import { useCustomKanbanStore } from "@/store/kanban/useCustomKanbanStore";

export function useCustomColumnActions() {
    const projectId = useActiveProject()?.id;
    const createColumn = useCreateColumn();
    const updateColumn = useUpdateColumn();
    const deleteColumn = useDeleteColumn();

    const addColumn = async (title: string) => {
        const name = title.trim();
        if (!name || !projectId) return false;
        try {
            const column = await createColumn.mutateAsync({ project_id: projectId, label: name });
            useCustomKanbanStore
                .getState()
                .addColumnLocal({ id: column.id, title: column.label, cards: [] });
            return true;
        } catch {
            toast.error("Couldn't create the list.");
            return false;
        }
    };

    const removeColumn = async (columnId: string) => {
        if (!projectId) return;
        useCustomKanbanStore.getState().removeColumnLocal(columnId);
        try {
            await deleteColumn.mutateAsync({ id: columnId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the list.");
        }
    };

    const renameColumn = async (columnId: string, label: string) => {
        const name = label.trim();
        if (!name || !projectId) return;
        useCustomKanbanStore.getState().renameColumnLocal(columnId, name);
        try {
            await updateColumn.mutateAsync({ id: columnId, project_id: projectId, label: name });
        } catch {
            toast.error("Couldn't rename the list.");
        }
    };

    return { addColumn, removeColumn, renameColumn, addingColumn: createColumn.isPending };
}
