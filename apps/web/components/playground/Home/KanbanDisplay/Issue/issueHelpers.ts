import { IssueStatus } from "@trymatcha/types";
import type { BoardColumn, BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import type { CapsuleOption } from "./Capsule";

export const PRIORITY_OPTIONS: CapsuleOption[] = [
    { value: "urgent", label: "Urgent", dotClassName: "bg-rose-500" },
    { value: "high", label: "High", dotClassName: "bg-amber-400" },
    { value: "normal", label: "Normal", dotClassName: "bg-neutral-500" },
    { value: "low", label: "Low", dotClassName: "bg-neutral-600" },
];

export function isEditable(issue: BoardIssue): boolean {
    return (
        issue.status === IssueStatus.Todo ||
        issue.status === IssueStatus.Queued ||
        issue.status === IssueStatus.Parked
    );
}

export function targetForIssue(issue: BoardIssue, columns: BoardColumn[]): IssueTarget {
    if (!issue.customColumnId) return { board: "llm" };
    const column = columns.find((c) => c.id === issue.customColumnId);
    return {
        board: "custom",
        columnId: issue.customColumnId,
        columnTitle: column?.label ?? "",
    };
}
