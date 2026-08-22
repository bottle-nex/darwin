"use client";
import type { BoardColumn, BoardIssue } from "@/types/board";
import IssueProperties from "@/components/playground/Issue/IssueProperties";
import { targetForIssue } from "@/components/playground/Issue/issueHelpers";
import { useIssueForm } from "@/components/playground/Issue/useIssueForm";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useIssue } from "@/hooks/issues/useIssue";
import { useActiveProject } from "@/hooks/useActiveProject";

export default function ReviewIssueProperties({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: issue } = useIssue(projectId, issueId);
    const { data: metadata } = useBoardColumns(projectId);

    if (!issue) return <aside aria-hidden />;

    return <ResolvedProperties issue={issue} columns={metadata?.columns ?? []} />;
}

function ResolvedProperties({ issue, columns }: { issue: BoardIssue; columns: BoardColumn[] }) {
    const form = useIssueForm({
        target: targetForIssue(issue, columns),
        issue,
        initialDescription: issue.description,
        readOnly: true,
    });

    return <IssueProperties form={form} issue={issue} />;
}
