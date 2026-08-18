"use client";
import { toast } from "sonner";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useDeleteIssue } from "@/hooks/issues/useDeleteIssue";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { useIssueStore } from "@/store/issues/useIssueStore";

export default function DeleteIssueDialog() {
    const { issueId, close } = useDeleteIssueStore();
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);
    const deleteIssue = useDeleteIssue();

    const issue = issueId ? board?.issues.find((row) => row.id === issueId) : undefined;

    function dismiss() {
        close();
        deleteIssue.reset();
    }

    function confirmDelete() {
        if (!issue || !projectId) return;
        deleteIssue.mutate(
            { id: issue.id, project_id: projectId },
            {
                onSuccess: () => {
                    toast.success("Issue deleted.");
                    close();
                    if (useIssueStore.getState().mode?.kind === "open") {
                        useIssueStore.getState().close();
                    }
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={Boolean(issue)}
            onOpenChange={(next) => !next && dismiss()}
            title="Delete issue?"
            description={
                <>
                    This permanently deletes{" "}
                    <span className="font-medium text-neutral-200">
                        &ldquo;{issue?.title}&rdquo;
                    </span>
                    . You can&apos;t undo this.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteIssue.isPending}
            error={deleteIssue.isError ? "Couldn't delete the issue. Try again." : undefined}
        />
    );
}
