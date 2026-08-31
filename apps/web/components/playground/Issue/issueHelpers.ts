import { IssueStatus } from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";
import {
    HighPriorityIcon,
    LowPriorityIcon,
    MediumPriorityIcon,
    NoPriorityIcon,
    UrgentPriorityIcon,
} from "@trymatcha/ui/icons";

import type { IssueTarget } from "@/store/issues/useCreateIssueStore";
import type { BoardColumn, BoardIssue, ServerIssueStatus } from "@/types/board";
import type { IssueCommandPage } from "@/types/command.type";
import type { Priority } from "@/types/kanban";

export const DATE_ICON_COLOR = {
    start: "text-yellow-400",
    target: "text-orange-400",
} as const;

export const ROW_GLYPH_CELL = "flex size-4 shrink-0 items-center justify-center";

export const STACKED_CAPSULE =
    "w-full rounded-md bg-transparent px-1.5 py-1.5 text-[13.5px] text-neutral-200 ring-0 [&_svg]:size-[18px] hover:bg-snow/5 disabled:cursor-default disabled:text-neutral-400 disabled:hover:bg-transparent";

export type PriorityOption = {
    value: Priority;
    label: string;
    icon: IconType;
    rank: number;
    iconClassName?: string;
};

export const PRIORITY_OPTIONS: PriorityOption[] = [
    { value: "none", label: "No priority", icon: NoPriorityIcon, rank: 0 },
    {
        value: "urgent",
        label: "Urgent",
        icon: UrgentPriorityIcon,
        rank: 1,
        iconClassName: "size-3.25! text-orange-500",
    },
    { value: "high", label: "High", icon: HighPriorityIcon, rank: 2 },
    { value: "medium", label: "Medium", icon: MediumPriorityIcon, rank: 3 },
    { value: "low", label: "Low", icon: LowPriorityIcon, rank: 4 },
];

export function isEditable(issue: BoardIssue): boolean {
    return (
        issue.status === IssueStatus.Todo ||
        issue.status === IssueStatus.Queued ||
        issue.status === IssueStatus.Parked
    );
}

/**
 * The agent owns where an issue sits on the board while it is working it, so those
 * two fields freeze mid-run. Everything else — priority, tags, assignees, dates —
 * stays editable at any status; retagging a finished issue is normal.
 */
const AGENT_RUNNING: ServerIssueStatus[] = [IssueStatus.InProgress, IssueStatus.InReview];

export function isFieldEditable(issues: BoardIssue[], field: IssueCommandPage): boolean {
    if (issues.length === 0) return false;
    if (field !== "status" && field !== "move") return true;
    return issues.every((issue) => !AGENT_RUNNING.includes(issue.status));
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
