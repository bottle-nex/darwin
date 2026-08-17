import type { IconType } from "react-icons";
import { LuEllipsis } from "react-icons/lu";
import { BsExclamationSquareFill } from "react-icons/bs";
import { IssueStatus } from "@trymatcha/types";
import type { BoardColumn, BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useIssueStore";
import type { Priority } from "@/types/kanban";
import {
    RiSignalCellular1Fill,
    RiSignalCellular2Fill,
    RiSignalCellular3Fill,
} from "react-icons/ri";

export const DATE_ICON_COLOR = {
    start: "text-yellow-400",
    target: "text-orange-400",
} as const;

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
        iconClassName: "text-[#FF2C56]",
    },
    { value: "high", label: "High", icon: RiSignalCellular3Fill, rank: 2 },
    { value: "medium", label: "Medium", icon: RiSignalCellular2Fill, rank: 3 },
    { value: "low", label: "Low", icon: RiSignalCellular1Fill, rank: 4 },
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
