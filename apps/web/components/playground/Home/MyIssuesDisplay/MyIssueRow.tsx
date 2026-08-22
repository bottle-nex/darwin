"use client";

import { HiCalendar } from "react-icons/hi2";
import { LuColumns3 } from "react-icons/lu";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import IssueDropdown from "@/components/playground/Home/KanbanDisplay/IssueDropdown";
import IssueTags from "@/components/playground/Home/KanbanDisplay/IssueTags";
import {
    issueIdentifier,
    shortDate,
} from "@/components/playground/Home/KanbanDisplay/cards/IssueCardFace";
import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { useIssueNavigation } from "@/components/playground/Issue/useIssueNavigation";
import { useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";

function IssueAssignees({ issue }: { issue: BoardIssue }) {
    const assignees = issue.assignees.map((assignee) => KanbanMappers.toAssignee(assignee));
    const shown = assignees.slice(0, 3);
    const hidden = assignees.length - shown.length;

    return (
        <span className="flex shrink-0 items-center -space-x-1">
            {shown.map((assignee) => (
                <PlaygroundAvatar
                    key={assignee.id}
                    letter={assignee.name.charAt(0).toUpperCase()}
                    src={assignee.image}
                    tone={assignee.tone}
                    size="sm"
                    className="ring-1 ring-neutral-900"
                />
            ))}
            {hidden > 0 && (
                <span className="flex size-5 items-center justify-center rounded-md bg-neutral-800 text-[9px] text-neutral-300 ring-1 ring-white/10">
                    +{hidden}
                </span>
            )}
        </span>
    );
}

export default function MyIssueRow({
    issue,
    projectName,
}: {
    issue: BoardIssue;
    projectName: string;
}) {
    const { openIssue } = useIssueNavigation();
    const { isSelected, handleSelectClick } = useIssueSelection("my-issues");
    const selected = isSelected(issue.id);
    const status = KanbanBoard.columnFor(issue.status);
    const StatusIcon = status?.icon ?? LuColumns3;
    const priority = PRIORITY_OPTIONS.find((option) => option.rank === issue.priority);

    const row = (
        <button
            type="button"
            data-issue-id={issue.id}
            data-selection-scope="my-issues"
            data-selected={selected}
            onClick={(event) => {
                if (handleSelectClick(event, issue.id)) return;
                openIssue(issue.id);
            }}
            className={cn(
                "group flex w-full min-w-0 cursor-pointer items-center gap-2.5 border-b border-white/5 px-3 py-2.5 text-left transition-colors last:border-b-0 focus-visible:bg-white/[0.035] focus-visible:outline-none",
                selected
                    ? "bg-primary/12 hover:bg-primary/15"
                    : "bg-neutral-900/20 hover:bg-white/[0.035]",
            )}
        >
            <StatusIcon
                className={cn("size-4 shrink-0", status?.titleBox ?? "text-neutral-400")}
                aria-label={status?.title ?? "Parked"}
            />
            <span className="w-16 shrink-0 font-mono text-[11px] text-neutral-500">
                {issueIdentifier(projectName, issue.number)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-100">
                {issue.title}
            </span>
            <IssueTags tags={issue.tags} max={2} className="hidden max-w-56 shrink-0 lg:flex" />
            {priority && issue.priority > 0 && (
                <span
                    className="hidden shrink-0 items-center gap-1 text-[11px] text-neutral-500 md:flex"
                    title={priority.label}
                >
                    <priority.icon className={cn("size-3.5", priority.iconClassName)} aria-hidden />
                    {priority.label}
                </span>
            )}
            {issue.targetDate && (
                <span className="hidden shrink-0 items-center gap-1 text-[11px] text-neutral-500 xl:flex">
                    <HiCalendar className={cn("size-3.5", DATE_ICON_COLOR.target)} aria-hidden />
                    {shortDate(issue.targetDate)}
                </span>
            )}
            <IssueAssignees issue={issue} />
            <span className="hidden w-14 shrink-0 text-right text-[11px] text-neutral-500 sm:block">
                {shortDate(issue.createdAt)}
            </span>
        </button>
    );

    return (
        <IssueDropdown issueId={issue.id} issue={issue}>
            {row}
        </IssueDropdown>
    );
}
