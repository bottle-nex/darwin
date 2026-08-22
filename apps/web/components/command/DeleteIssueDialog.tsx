"use client";
import { toast } from "@/lib/toast";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssues } from "@/hooks/issues/useIssue";
import { useBulkDeleteIssues } from "@/hooks/issues/useBulkDeleteIssues";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";

export default function DeleteIssueDialog() {
    const { issueIds, close } = useDeleteIssueStore();
    const projectId = useActiveProject()?.id;
    const { issues, isPending, isError, isComplete, retry } = useIssues(projectId, issueIds);
    const deleteIssues = useBulkDeleteIssues();

    const many = issueIds.length > 1;

    function dismiss() {
        close();
        deleteIssues.reset();
    }

    function confirmDelete() {
        if (!isComplete || !issues.length || !projectId) return;
        deleteIssues.mutate(
            { issue_ids: issueIds, project_id: projectId },
            {
                onSuccess: (data) => {
                    toast.success(
                        data.deleted.length > 1
                            ? `Deleted ${data.deleted.length} issues.`
                            : "Issue deleted.",
                    );
                    close();
                    useIssueSelectionStore.getState().clear();
                    if (usePaneRouteStore.getState().route.kind === "issue") {
                        usePaneRouteStore.getState().openBoard();
                    }
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={issueIds.length > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={many ? `Delete ${issueIds.length} issues?` : "Delete issue?"}
            description={
                many ? (
                    <>
                        This permanently deletes all{" "}
                        <span className="font-medium text-neutral-200">{issueIds.length}</span>{" "}
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
            confirm={
                isError
                    ? { label: "Retry", variant: "tertiary", onClick: () => void retry() }
                    : { label: "Delete", variant: "destructive", onClick: confirmDelete }
            }
            pending={isPending || deleteIssues.isPending}
            error={
                isError
                    ? "Some issues couldn't be loaded. Retry before deleting."
                    : deleteIssues.isError
                      ? many
                          ? "Couldn't delete those issues. Try again."
                          : "Couldn't delete the issue. Try again."
                      : undefined
            }
        />
    );
}
