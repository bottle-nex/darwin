"use client";
import { toast } from "sonner";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDeleteTag } from "@/hooks/tags/useDeleteTag";
import { useDeleteTagStore } from "@/store/tags/useDeleteTagStore";

export default function DeleteTagDialog() {
    const { tag, close } = useDeleteTagStore();
    const projectId = useActiveProject()?.id;
    const deleteTag = useDeleteTag();

    function dismiss() {
        close();
        deleteTag.reset();
    }

    function confirmDelete() {
        if (!tag || !projectId) return;
        deleteTag.mutate(
            { projectId, tagId: tag.id },
            {
                onSuccess: () => {
                    toast.success("Tag deleted.");
                    close();
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={tag !== null}
            onOpenChange={(next) => !next && dismiss()}
            title="Delete tag?"
            description={
                <>
                    This removes <span className="font-medium text-neutral-200">{tag?.name}</span>{" "}
                    from the project. Issues using it lose this label and this can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteTag.isPending}
            error={deleteTag.isError ? "Couldn't delete the tag. Try again." : undefined}
        />
    );
}
