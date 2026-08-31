"use client";

import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SelectableRow from "@/components/playground/Core/components/SelectableRow";
import IssueBoardChip from "@/components/playground/Issue/IssueBoardChip";
import IssueFieldChip from "@/components/playground/Issue/IssueFieldChip";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { shortDate } from "@/lib/format";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import type { IssueSelectionScope } from "@/store/issues/useIssueSelectionStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue, BoardTag } from "@/types/board";
import type { Assignee } from "@/types/kanban";

import IssueDropdown from "./IssueDropdown";
import IssueTags from "./IssueTags";

type IssueListRowProps = {
    issueId: string;
    number: number | string;
    title: string;
    status: string | undefined;
    tags: BoardTag[];
    assignees: Assignee[];
    createdAt?: string | null;
    boardIssue?: BoardIssue;
    selectionScope: IssueSelectionScope;
    /** The row directly above is selected too — see `SelectableRow`. */
    joinedAbove?: boolean;
    /** The row directly below is selected too — see `SelectableRow`. */
    joinedBelow?: boolean;
};

export default function IssueListRow({
    issueId,
    number,
    title,
    status,
    tags,
    assignees,
    createdAt,
    boardIssue,
    selectionScope,
    joinedAbove,
    joinedBelow,
}: IssueListRowProps) {
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const identifier = useIssueIdentifier()(number);
    const { selectedIds, isSelected, toggleSelection, handleSelectClick } =
        useIssueSelection(selectionScope);
    const selected = isSelected(issueId);
    // Read off the row's own issue rather than a new prop, so both lists that
    // render this row get priority without threading it through each of them.
    const priorityOption = PRIORITY_OPTIONS.find(
        (option) =>
            boardIssue !== undefined &&
            option.value === KanbanMappers.NUMBER_TO_PRIORITY[boardIssue.priority],
    );
    const PriorityIcon = priorityOption?.icon;
    const row = (
        <SelectableRow
            data-issue-id={issueId}
            data-selection-scope={selectionScope}
            data-selected={selected}
            selected={selected}
            selectionActive={selectedIds.length > 0}
            joinedAbove={joinedAbove}
            joinedBelow={joinedBelow}
            selectionLabel={
                selected ? `Deselect issue ${identifier}` : `Select issue ${identifier}`
            }
            onToggleSelection={() => toggleSelection(issueId)}
            className="min-h-11 w-full px-3 text-left"
        >
            {PriorityIcon && (
                <IssueFieldChip
                    contentClassName="w-46"
                    issueId={issueId}
                    issue={boardIssue}
                    field="priority"
                >
                    <PriorityIcon
                        className={cn(
                            "size-4 shrink-0 text-neutral-400",
                            priorityOption.iconClassName,
                        )}
                        aria-hidden
                    />
                </IssueFieldChip>
            )}
            <IssueBoardChip
                issueId={issueId}
                issue={boardIssue}
                status={status}
                contentClassName="w-48"
            />

            <button
                type="button"
                onClick={(event) => {
                    if (handleSelectClick(event, issueId)) return;
                    openIssue(issueId);
                }}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left focus-visible:outline-none"
            >
                <span className="w-14 shrink-0 font-mono text-[12px] text-snow/70">
                    {identifier}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-100">
                    {title}
                </span>
            </button>

            <IssueFieldChip
                issueId={issueId}
                issue={boardIssue}
                field="tags"
                className="hidden w-80 shrink-0 cursor-pointer items-center justify-end disabled:cursor-default lg:flex"
            >
                <IssueTags tags={tags} className="flex-nowrap justify-end" />
            </IssueFieldChip>

            <IssueFieldChip
                issueId={issueId}
                issue={boardIssue}
                field="assignees"
                className="flex w-16 shrink-0 cursor-pointer items-center justify-end -space-x-1 overflow-hidden disabled:cursor-default"
            >
                {assignees.slice(0, 4).map((assignee) => (
                    <PlaygroundAvatar
                        key={assignee.id}
                        letter={assignee.name.charAt(0).toUpperCase()}
                        src={assignee.image}
                        tone={assignee.tone}
                        size="sm"
                        className="ring-1 ring-neutral-800"
                    />
                ))}
            </IssueFieldChip>

            {createdAt && (
                <span className="hidden w-14 shrink-0 text-right text-[11px] text-neutral-500 sm:block">
                    {shortDate(createdAt)}
                </span>
            )}
        </SelectableRow>
    );

    return (
        <IssueDropdown issueId={issueId} issue={boardIssue}>
            {row}
        </IssueDropdown>
    );
}
