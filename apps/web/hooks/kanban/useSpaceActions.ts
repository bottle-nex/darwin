"use client";
import type { IconPick } from "@/components/ui/IconPicker";
import { useCreateSpace } from "@/hooks/issues/useCreateSpace";
import { useDeleteSpace } from "@/hooks/issues/useDeleteSpace";
import { useUpdateSpace } from "@/hooks/issues/useUpdateSpace";
import { useActiveProject } from "@/hooks/useActiveProject";
import { slugify } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { BoardSpace } from "@/types/board";

/** Everything the space form collects. `null` clears the field. */
export type SpaceDraft = {
    name: string;
    description: string | null;
    startDate: string | null;
    targetDate: string | null;
    icon: IconPick | null;
};

export function useSpaceActions() {
    const projectId = useActiveProject()?.id;
    const createSpace = useCreateSpace();
    const updateSpace = useUpdateSpace();
    const deleteSpace = useDeleteSpace();

    const addSpace = async (draft: SpaceDraft): Promise<BoardSpace | null> => {
        const name = draft.name.trim();
        const slug = slugify(name);
        if (!name || !slug || !projectId) return null;
        try {
            return await createSpace.mutateAsync({
                project_id: projectId,
                name,
                slug,
                description: draft.description,
                start_date: draft.startDate,
                target_date: draft.targetDate,
                icon: draft.icon,
            });
        } catch {
            toast.error("Couldn't create the space.");
            return null;
        }
    };

    // Takes a partial so an inline edit — setting a date from the list — sends only
    // that field. The slug is deliberately left alone so links to a space keep resolving.
    const editSpace = async (id: string, edit: Partial<SpaceDraft>): Promise<BoardSpace | null> => {
        const name = edit.name?.trim();
        if (!projectId || (edit.name !== undefined && !name)) return null;
        try {
            return await updateSpace.mutateAsync({
                id,
                project_id: projectId,
                name,
                description: edit.description,
                start_date: edit.startDate,
                target_date: edit.targetDate,
                icon: edit.icon,
            });
        } catch {
            toast.error("Couldn't update the space.");
            return null;
        }
    };

    const removeSpace = async (id: string) => {
        if (!projectId) return false;
        try {
            await deleteSpace.mutateAsync({ id, project_id: projectId });
            return true;
        } catch {
            toast.error("Couldn't delete the space.");
            return false;
        }
    };

    return {
        addSpace,
        editSpace,
        removeSpace,
        addingSpace: createSpace.isPending,
        editingSpace: updateSpace.isPending,
        removingSpace: deleteSpace.isPending,
    };
}
