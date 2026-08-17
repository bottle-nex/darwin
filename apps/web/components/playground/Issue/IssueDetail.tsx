"use client";
import type { BoardColumn, BoardIssue } from "@/types/board";
import IssueTitleFields from "./IssueTitleFields";
import IssueBody from "./IssueBody";
import IssueSubmitFooter from "./IssueSubmitFooter";
import IssueProperties from "./IssueProperties";
import IssueChatPanel from "./chat/IssueChatPanel";
import { isEditable, targetForIssue } from "./issueHelpers";
import { useIssueForm } from "./useIssueForm";

export default function IssueDetail({
    issue,
    columns,
}: {
    issue: BoardIssue;
    columns: BoardColumn[];
}) {
    const form = useIssueForm({
        target: targetForIssue(issue, columns),
        issue,
        initialDescription: issue.description,
        readOnly: !isEditable(issue),
    });

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-row m-4">
            <div className="flex min-h-0 w-full min-w-0 max-w-200 flex-col">
                <div
                    data-lenis-prevent
                    className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-10 py-8"
                >
                    <div className="flex w-full flex-col gap-y-4">
                        <IssueTitleFields form={form} />
                        <IssueBody form={form} />
                    </div>
                </div>
                <div className="shrink-0 px-10 py-3">
                    <IssueSubmitFooter form={form} />
                </div>
            </div>
            <IssueProperties form={form} issue={issue} />
            <IssueChatPanel issueId={issue.id} />
        </div>
    );
}
