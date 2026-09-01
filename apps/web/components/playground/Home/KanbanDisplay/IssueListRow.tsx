"use client";

import { PullRequestOpenIcon } from "@trymatcha/ui/icons";

import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SelectableRow from "@/components/playground/Core/components/SelectableRow";
import IssueBoardChip from "@/components/playground/Issue/IssueBoardChip";
import IssueFieldChip from "@/components/playground/Issue/IssueFieldChip";
import { PRIORITY_OPTIONS, ROW_GLYPH_CELL } from "@/components/playground/Issue/issueHelpers";
import { reviewSlugFor } from "@/components/playground/Review/reviewSlug";
import IconWrapper from "@/components/ui/IconWrapper";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { shortDate } from "@/lib/format";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import type { IssueSelectionScope } from "@/store/issues/useIssueSelectionStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue, BoardTag } from "@/types/board";
import { type Assignee, KanbanStatus } from "@/types/kanban";

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
    const openReview = usePaneRouteStore((s) => s.openReview);
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
    const pullNumber = boardIssue?.prNumber ?? null;
    const pullRequestPill =
        boardIssue && pullNumber !== null ? (
            <button
                type="button"
                aria-label={`Review pull request ${pullNumber}`}
                onClick={(event) => {
                    event.stopPropagation();
                    openReview({ pullNumber, slug: reviewSlugFor(boardIssue) });
                }}
                className="hidden w-16 shrink-0 cursor-pointer text-left sm:block"
            >
                <IconWrapper
                    icon={PullRequestOpenIcon}
                    variant="ring"
                    iconClassName={KanbanBoard.glyphFor(KanbanStatus.InReview).titleBox}
                    title="Open the review"
                >
                    <span className="text-snow">#{pullNumber}</span>
                </IconWrapper>
            </button>
        ) : (
            <span className="hidden w-16 shrink-0 sm:block" />
        );
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
            {PriorityIcon ? (
                <IssueFieldChip
                    contentClassName="w-46"
                    issueId={issueId}
                    issue={boardIssue}
                    field="priority"
                    className={cn(ROW_GLYPH_CELL, "cursor-pointer")}
                >
                    <PriorityIcon
                        className={cn(
                            "size-4 shrink-0 text-neutral-400",
                            priorityOption.iconClassName,
                        )}
                        aria-hidden
                    />
                </IssueFieldChip>
            ) : (
                <span className={ROW_GLYPH_CELL} />
            )}

            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                <button
                    type="button"
                    onClick={(event) => {
                        if (handleSelectClick(event, issueId)) return;
                        openIssue(issueId);
                    }}
                    className="flex min-w-0 cursor-pointer items-center text-left focus-visible:outline-none"
                >
                    <span className="w-14 shrink-0 font-mono text-[12px] text-snow/70">
                        {identifier}
                    </span>
                    <IssueBoardChip
                        issueId={issueId}
                        issue={boardIssue}
                        status={status}
                        contentClassName="w-48"
                    />
                    <span className="min-w-0 truncate pl-2 text-[13px] font-medium text-neutral-100">
                        {title}
                    </span>
                </button>

                <IssueFieldChip
                    issueId={issueId}
                    issue={boardIssue}
                    field="tags"
                    className="hidden shrink-0 cursor-pointer items-center disabled:cursor-default lg:flex py-0.5"
                >
                    <IssueTags tags={tags} className="flex-nowrap" />
                </IssueFieldChip>
            </div>

            {pullRequestPill}

            <IssueFieldChip
                issueId={issueId}
                issue={boardIssue}
                field="assignees"
                className="flex w-13 shrink-0 cursor-pointer items-center -space-x-1 disabled:cursor-default"
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
