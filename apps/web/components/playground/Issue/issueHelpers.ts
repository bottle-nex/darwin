import { hasHumanMove, isBodyEditable, isReopenable } from "@trydarwin/types";
import type { IconType } from "@trydarwin/ui/icons";
import {
    HighPriorityIcon,
    LowPriorityIcon,
    MediumPriorityIcon,
    NoPriorityIcon,
    UrgentPriorityIcon,
} from "@trydarwin/ui/icons";

import type { IssueTarget } from "@/store/issues/useCreateIssueStore";
import type { BoardColumn, BoardIssue } from "@/types/board";
import type { IssueCommandPage } from "@/types/command.type";
import type { Priority } from "@/types/kanban";

export const DATE_ICON_COLOR = {
    start: "text-yellow-400",
    target: "text-orange-400",
} as const;

export const ROW_GLYPH_CELL = "flex size-4 shrink-0 items-center justify-center";

export const ATTACHMENT_ROW =
    "flex w-full items-center gap-2 rounded-md px-0 py-1.5 text-left text-[13.5px] text-neutral-200 no-underline transition-colors hover:bg-snow/5";

export const ATTACHMENT_ROW_CHILD = "pl-[18px]";

export const ATTACHMENT_TREE_BRANCH = "left-0";

export const ATTACHMENT_GLYPH = "size-3.5 shrink-0";

export const STACKED_CAPSULE =
    "w-full rounded-md bg-transparent px-1.5 py-1.5 text-[13.5px] text-neutral-200 ring-0 [&_svg]:size-[18px] hover:bg-snow/5 disabled:cursor-default disabled:text-neutral-400 disabled:hover:bg-transparent";

export type PriorityOption = {
    value: Priority;
    label: string;
    icon: IconType;
    rank: number;
    iconClassName?: string;
};

/** A card's `Priority` as the server's 0–4 priority scale. */
export const PRIORITY_TO_NUMBER: Record<Priority, 0 | 1 | 2 | 3 | 4> = {
    none: 0,
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
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
    return isBodyEditable(issue.status);
}

export function isFieldEditable(issues: BoardIssue[], field: IssueCommandPage): boolean {
    if (issues.length === 0) return false;
    if (field !== "status" && field !== "move") return true;
    return issues.every((issue) => hasHumanMove(issue.status));
}

export function canReopen(issue: BoardIssue): boolean {
    return isReopenable(issue.status);
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
