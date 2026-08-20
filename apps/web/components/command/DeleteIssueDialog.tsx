"use client";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useBulkDeleteIssues } from "@/hooks/issues/useBulkDeleteIssues";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { useIssueStore } from "@/store/issues/useIssueStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";

export default function DeleteIssueDialog() {
    const { issueIds, close } = useDeleteIssueStore();
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);
    const deleteIssues = useBulkDeleteIssues();

    const issues = issueIds
        .map((id) => board?.issues.find((row) => row.id === id))
        .filter((row) => Boolean(row));
    const many = issues.length > 1;

    function dismiss() {
        close();
        deleteIssues.reset();
    }

    function confirmDelete() {
        if (!issues.length || !projectId) return;
        deleteIssues.mutate(
            { issue_ids: issues.map((row) => row!.id), project_id: projectId },
            {
                onSuccess: (data) => {
                    toast.success(
                        data.deleted.length > 1
                            ? `Deleted ${data.deleted.length} issues.`
                            : "Issue deleted.",
                    );
                    close();
                    useIssueSelectionStore.getState().clear();
                    if (useIssueStore.getState().mode?.kind === "open") {
                        useIssueStore.getState().close();
                    }
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={issues.length > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={many ? `Delete ${issues.length} issues?` : "Delete issue?"}
            description={
                many ? (
                    <>
                        This permanently deletes all{" "}
                        <span className="font-medium text-neutral-200">{issues.length}</span>{" "}
                        selected issues. You can&apos;t undo this.
                    </>
                ) : (
                    <>
                        This permanently deletes{" "}
                        <span className="font-medium text-neutral-200">
                            &ldquo;{issues[0]?.title}&rdquo;
                        </span>
                        . You can&apos;t undo this.
                    </>
                )
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteIssues.isPending}
            error={
                deleteIssues.isError
                    ? many
                        ? "Couldn't delete those issues. Try again."
                        : "Couldn't delete the issue. Try again."
                    : undefined
            }
        />
    );
}
