import { IssueStatus } from "@trymatcha/types";
import type { IconType } from "@trymatcha/ui/icons";
import { KanbanColumnsIcon } from "@trymatcha/ui/icons";

import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type {
    MyIssuesGroup,
    MyIssuesOrder,
    MyIssuesView,
} from "@/store/issues/useMyIssuesOptionsStore";
import type { BoardIssue } from "@/types/board";

const PRIORITY_ORDER = new Map([1, 2, 3, 4, 0].map((priority, index) => [priority, index]));

type MyIssueGroup = {
    key: string;
    label: string;
    icon: IconType;
    iconClassName: string;
    issues: BoardIssue[];
};

export function isIssueRelevant(issue: BoardIssue, userId: string, view: MyIssuesView): boolean {
    return view === "assigned"
        ? issue.assignees.some((assignee) => assignee.id === userId)
        : issue.creator?.id === userId;
}

function compareIssues(a: BoardIssue, b: BoardIssue, orderBy: MyIssuesOrder): number {
    if (orderBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (orderBy === "priority") {
        const priorityDifference =
            (PRIORITY_ORDER.get(a.priority) ?? 5) - (PRIORITY_ORDER.get(b.priority) ?? 5);
        return priorityDifference || b.number - a.number;
    }
    if (orderBy === "number") return b.number - a.number;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function groupIssues(
    issues: BoardIssue[],
    groupBy: MyIssuesGroup,
    orderBy: MyIssuesOrder,
): MyIssueGroup[] {
    const sorted = [...issues].sort((a, b) => compareIssues(a, b, orderBy));

    if (groupBy === "none") {
        return [
            {
                key: "all",
                label: "All issues",
                icon: KanbanBoard.COLUMNS[0].icon,
                iconClassName: "text-neutral-400",
                issues: sorted,
            },
        ];
    }

    if (groupBy === "priority") {
        const priorityOptions = [
            ...PRIORITY_OPTIONS.filter((option) => option.rank > 0),
            PRIORITY_OPTIONS[0],
        ];
        return priorityOptions
            .map((option) => ({
                key: `priority-${option.rank}`,
                label: option.label,
                icon: option.icon,
                iconClassName: option.iconClassName ?? "text-neutral-400",
                issues: sorted.filter((issue) => issue.priority === option.rank),
            }))
            .filter((group) => group.issues.length > 0);
    }

    const statusGroups: MyIssueGroup[] = KanbanBoard.COLUMNS.map((column) => ({
        key: column.status,
        label: column.title,
        icon: column.icon,
        iconClassName: column.titleBox,
        issues: sorted.filter((issue) => issue.status === column.status),
    }));
    const parkedIssues = sorted.filter((issue) => issue.status === IssueStatus.Parked);

    if (parkedIssues.length > 0) {
        statusGroups.push({
            key: IssueStatus.Parked,
            label: "Parked",
            icon: KanbanColumnsIcon,
            iconClassName: "text-neutral-400",
            issues: parkedIssues,
        });
    }

    return statusGroups.filter((group) => group.issues.length > 0);
}
