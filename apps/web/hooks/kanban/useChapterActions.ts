"use client";
import type { IconPick } from "@/components/ui/IconPicker";
import { useCreateChapter } from "@/hooks/issues/useCreateChapter";
import { useDeleteChapter } from "@/hooks/issues/useDeleteChapter";
import { useUpdateChapter } from "@/hooks/issues/useUpdateChapter";
import { useActiveProject } from "@/hooks/useActiveProject";
import { slugify } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { BoardChapter } from "@/types/board";

export function useChapterActions() {
    const projectId = useActiveProject()?.id;
    const createChapter = useCreateChapter();
    const updateChapter = useUpdateChapter();
    const deleteChapter = useDeleteChapter();

    const addChapter = async (
        name: string,
        icon?: IconPick | null,
    ): Promise<BoardChapter | null> => {
        const trimmed = name.trim();
        const slug = slugify(trimmed);
        if (!trimmed || !slug || !projectId) return null;
        try {
            return await createChapter.mutateAsync({
                project_id: projectId,
                name: trimmed,
                slug,
                icon,
            });
        } catch {
            toast.error("Couldn't create the chapter.");
            return null;
        }
    };

    const renameChapter = async (id: string, name: string) => {
        const trimmed = name.trim();
        const slug = slugify(trimmed);
        if (!trimmed || !slug || !projectId) return;
        try {
            await updateChapter.mutateAsync({ id, project_id: projectId, name: trimmed, slug });
        } catch {
            toast.error("Couldn't rename the chapter.");
        }
    };

    const removeChapter = async (id: string) => {
        if (!projectId) return false;
        try {
            await deleteChapter.mutateAsync({ id, project_id: projectId });
            return true;
        } catch {
            toast.error("Couldn't delete the chapter.");
            return false;
        }
    };

    return {
        addChapter,
        renameChapter,
        removeChapter,
        addingChapter: createChapter.isPending,
        removingChapter: deleteChapter.isPending,
    };
}
