"use client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import IssueForm from "./IssueForm";
import IssuePending from "./IssuePending";
import { isEditable, targetForIssue } from "./issueHelpers";

export default function CreateOrEditIssueDialog() {
    const { mode } = useIssueDialog();
    if (!mode) return null;
    if (mode.kind === "create") return <CreateIssue target={mode.target} />;
    return <EditIssue issueId={mode.issueId} />;
}

function CreateIssue({ target }: { target: IssueTarget }) {
    const projectId = useActiveProject()?.id;
    const { data: templates } = useListTemplates(projectId);

    const defaultTemplate = templates?.find((template) => template.isDefault);
    return <IssueForm target={target} issue={null} initialTemplate={defaultTemplate} />;
}

function EditIssue({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);

    const issue = board?.issues.find((i) => i.id === issueId);
    if (!board || !issue) return <IssuePending resolved={Boolean(board)} />;

    const target = targetForIssue(issue, board.columns);
    return (
        <IssueForm
            key={issue.id}
            target={target}
            issue={issue}
            initialDescription={issue.description}
            readOnly={!isEditable(issue)}
        />
    );
}
