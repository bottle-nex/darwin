import type { IconType } from "react-icons";
import { LuEllipsis } from "react-icons/lu";
import { BsExclamationSquareFill } from "react-icons/bs";
import { IssueStatus } from "@trymatcha/types";
import type { BoardColumn, BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useCreateIssueStore";
import type { Priority } from "@/types/kanban";
import {
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
} from "@/components/icons/PriorityIcons";

export const DATE_ICON_COLOR = {
    start: "text-yellow-400",
    target: "text-orange-400",
} as const;

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
    { value: "none", label: "No priority", icon: LuEllipsis, rank: 0 },
    {
        value: "urgent",
        label: "Urgent",
        icon: BsExclamationSquareFill,
        rank: 1,
        iconClassName: "size-3! text-[#FF2C56]",
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

export function targetForIssue(issue: BoardIssue, columns: BoardColumn[]): IssueTarget {
    if (!issue.customColumnId) return { board: "llm" };
    const column = columns.find((c) => c.id === issue.customColumnId);
    return {
        board: "custom",
        columnId: issue.customColumnId,
        columnTitle: column?.label ?? "",
    };
}
