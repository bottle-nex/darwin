"use client";
import { useCreateColumn } from "@/hooks/issues/useCreateColumn";
import { useDeleteColumn } from "@/hooks/issues/useDeleteColumn";
import { useUpdateColumn } from "@/hooks/issues/useUpdateColumn";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/lib/toast";

export function useCustomColumnActions() {
    const projectId = useActiveProject()?.id;
    const createColumn = useCreateColumn();
    const updateColumn = useUpdateColumn();
    const deleteColumn = useDeleteColumn();

    const addColumn = async (spaceId: string, title: string) => {
        const name = title.trim();
        if (!name || !projectId) return false;
        try {
            await createColumn.mutateAsync({
                project_id: projectId,
                space_id: spaceId,
                label: name,
            });
            return true;
        } catch {
            toast.error("Couldn't create the list.");
            return false;
        }
    };

    const removeColumn = async (columnId: string) => {
        if (!projectId) return;
        try {
            await deleteColumn.mutateAsync({ id: columnId, project_id: projectId });
        } catch {
            toast.error("Couldn't delete the list.");
        }
    };

    const renameColumn = async (columnId: string, label: string) => {
        const name = label.trim();
        if (!name || !projectId) return;
        try {
            await updateColumn.mutateAsync({ id: columnId, project_id: projectId, label: name });
        } catch {
            toast.error("Couldn't rename the list.");
        }
    };

    return { addColumn, removeColumn, renameColumn, addingColumn: createColumn.isPending };
}
