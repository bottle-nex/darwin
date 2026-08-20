"use client";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDeleteTag } from "@/hooks/tags/useDeleteTag";
import { useDeleteTagStore } from "@/store/tags/useDeleteTagStore";

export default function DeleteTagDialog() {
    const { tags, close } = useDeleteTagStore();
    const projectId = useActiveProject()?.id;
    const deleteTag = useDeleteTag();

    const isBulk = tags.length > 1;

    function dismiss() {
        close();
        deleteTag.reset();
    }

    async function confirmDelete() {
        if (!tags.length || !projectId) return;
        try {
            await Promise.all(
                tags.map((tag) => deleteTag.mutateAsync({ projectId, tagId: tag.id })),
            );
            toast.success(isBulk ? `${tags.length} tags deleted.` : "Tag deleted.");
            close();
        } catch {
            return;
        }
    }

    return (
        <ConfirmDialog
            open={tags.length > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={isBulk ? `Delete ${tags.length} tags?` : "Delete tag?"}
            description={
                <>
                    This removes{" "}
                    <span className="font-medium text-neutral-200">
                        {isBulk ? `${tags.length} tags` : tags[0]?.name}
                    </span>{" "}
                    from the project. Issues using {isBulk ? "them" : "it"} lose this label and this
                    can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteTag.isPending}
            error={
                deleteTag.isError
                    ? `Couldn't delete the ${isBulk ? "tags" : "tag"}. Try again.`
                    : undefined
            }
        />
    );
}
