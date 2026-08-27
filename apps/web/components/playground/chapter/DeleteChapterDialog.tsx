"use client";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useDeleteChapter } from "@/hooks/issues/useDeleteChapter";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDeleteChapterStore } from "@/store/chapter/useDeleteChapterStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

function plural(count: number, word: string) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default function DeleteChapterDialog() {
    const { chapter, close } = useDeleteChapterStore();
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);
    const selectedChapter = usePlaygroundNavStore((s) => s.selectedChapter);
    const clearChapter = usePlaygroundNavStore((s) => s.clearChapter);
    const deleteChapter = useDeleteChapter();

    const columns = (metadata?.columns ?? []).filter((c) => c.chapterId === chapter?.id);
    const issueCount = columns.reduce(
        (total, column) => total + (metadata?.totals.custom[column.id] ?? 0),
        0,
    );

    function dismiss() {
        close();
        deleteChapter.reset();
    }

    function confirmDelete() {
        if (!chapter || !projectId) return;
        deleteChapter.mutate(
            { id: chapter.id, project_id: projectId },
            {
                onSuccess: () => {
                    if (selectedChapter?.id === chapter.id) clearChapter();
                    close();
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={chapter !== null}
            onOpenChange={(next) => !next && dismiss()}
            title="Delete chapter?"
            description={
                <>
                    This deletes{" "}
                    <span className="font-medium text-neutral-200">{chapter?.name}</span> and its{" "}
                    {plural(columns.length, "list")}.{" "}
                    {issueCount > 0
                        ? `${plural(issueCount, "issue")} on it will move back to the Agent board as To Do.`
                        : "No issues are on it."}{" "}
                    This can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteChapter.isPending}
            typeToConfirm={chapter?.name}
            error={deleteChapter.isError ? "Couldn't delete the chapter. Try again." : undefined}
        />
    );
}
