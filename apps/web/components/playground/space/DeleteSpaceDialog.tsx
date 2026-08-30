"use client";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useBoardColumns, useSpaces } from "@/hooks/issues/useBoardColumns";
import { useDeleteSpace } from "@/hooks/issues/useDeleteSpace";
import { useActiveProject } from "@/hooks/useActiveProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useDeleteSpaceStore } from "@/store/space/useDeleteSpaceStore";
import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";

function plural(count: number, word: string) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default function DeleteSpaceDialog() {
    const { spaceIds, close } = useDeleteSpaceStore();
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);
    const allSpaces = useSpaces(projectId);
    const selectedSpace = usePlaygroundNavStore((s) => s.selectedSpace);
    const clearSpace = usePlaygroundNavStore((s) => s.clearSpace);
    const clearSelection = useSpaceSelectionStore((s) => s.clear);
    const deleteSpace = useDeleteSpace();

    const spaces = allSpaces.filter((space) => spaceIds.includes(space.id));
    const isBulk = spaces.length > 1;
    const columns = (metadata?.columns ?? []).filter((column) => spaceIds.includes(column.spaceId));
    const issueCount = columns.reduce(
        (total, column) => total + (metadata?.totals.custom[column.id] ?? 0),
        0,
    );

    function dismiss() {
        close();
        deleteSpace.reset();
    }

    async function confirmDelete() {
        if (!spaces.length || !projectId) return;
        try {
            await Promise.all(
                spaces.map((space) =>
                    deleteSpace.mutateAsync({ id: space.id, project_id: projectId }),
                ),
            );
            if (selectedSpace && spaceIds.includes(selectedSpace.id)) clearSpace();
            clearSelection();
            close();
        } catch {
            return;
        }
    }

    return (
        <ConfirmDialog
            open={spaces.length > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={isBulk ? `Delete ${spaces.length} spaces?` : "Delete space?"}
            description={
                <>
                    This deletes{" "}
                    <span className="font-medium text-neutral-200">
                        {isBulk ? `${spaces.length} spaces` : spaces[0]?.name}
                    </span>{" "}
                    and {isBulk ? "their" : "its"} {plural(columns.length, "list")}.{" "}
                    {issueCount > 0
                        ? `${plural(issueCount, "issue")} on ${isBulk ? "them" : "it"} will move back to the Agent board as To Do.`
                        : `No issues are on ${isBulk ? "them" : "it"}.`}{" "}
                    This can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteSpace.isPending}
            typeToConfirm={isBulk ? undefined : spaces[0]?.name}
            error={
                deleteSpace.isError
                    ? `Couldn't delete the ${isBulk ? "spaces" : "space"}. Try again.`
                    : undefined
            }
        />
    );
}
