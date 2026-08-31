import type { MyIssuesView } from "@/store/issues/useMyIssuesOptionsStore";
import type { BoardIssue } from "@/types/board";

export function isIssueRelevant(issue: BoardIssue, userId: string, view: MyIssuesView): boolean {
    return view === "assigned"
        ? issue.assignees.some((assignee) => assignee.id === userId)
        : issue.creator?.id === userId;
}
