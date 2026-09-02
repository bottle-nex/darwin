"use client";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useIssue } from "@/hooks/issues/useIssue";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { BoardColumn, BoardIssue } from "@/types/board";

import { targetForIssue } from "./issueHelpers";
import IssueProperties from "./IssueProperties";
import { useIssueForm } from "./useIssueForm";

/**
 * The issue's properties column, fetched by id and not editable.
 *
 * What a pane that is showing something belonging to an issue — a pull request, a solve
 * report — puts beside it, so the issue's own state stays on screen without that pane having
 * to own an issue form of its own.
 */
export default function ReadOnlyIssueProperties({ issueId }: { issueId: string }) {
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
