"use client";

import { useMemo } from "react";
import { LuColumns3 } from "react-icons/lu";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SelectableRow from "@/components/playground/Core/components/SelectableRow";
import { IssueSelectionOrderProvider, useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { KanbanStatus, type BoardState, type Issue } from "@/types/kanban";
import type { BoardLaneSelector } from "@/types/board";
import IssueTags from "./IssueTags";
import BoardLanePagination from "./BoardLanePagination";
import IssueDropdown from "./IssueDropdown";
import { shortDate } from "./cards/IssueCardFace";
import { VirtualizedRows } from "./VirtualizedRows";
import { flattenGroupedIssueRows } from "./virtualizedIssueRows";

type KanbanListViewProps = {
    board?: BoardState;
    includeCustom?: boolean;
};

type SelectionScope = "kanban" | "custom-kanban";

type ListGroup = {
    key: string;
    title: string;
    status?: KanbanStatus;
    selector: BoardLaneSelector;
    selectionScope: SelectionScope;
    issues: Issue[];
    total: number;
};

export default function KanbanListView({ board, includeCustom = false }: KanbanListViewProps) {
    const project = useActiveProject();
    const projectId = project?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const customColumns = useFilteredCustomColumns();
    const groups = useMemo<ListGroup[]>(() => {
        const customGroups = includeCustom
            ? customColumns.map((column) => ({
                  key: `custom:${column.id}`,
                  title: column.title,
                  selector: { type: "custom" as const, columnId: column.id },
                  selectionScope: "custom-kanban" as const,
                  issues: column.cards.map<Issue>((card) => ({
                      id: card.id,
                      boardIssue: card.boardIssue,
                      number: card.number ? `#${card.number}` : "#—",
                      title: card.title,
                      project: project?.name ?? "",
                      tags: card.tags,
                      priority: card.priority,
                      assignees: card.assignees,
                      comments: 0,
                      status: (card.status as KanbanStatus | undefined) ?? KanbanStatus.Todo,
                      createdAt: card.createdAt,
                      targetDate: card.targetDate,
                  })),
                  total: metadata?.totals.custom[column.id] ?? column.cards.length,
              }))
            : [];
        const systemGroups = board
            ? KanbanBoard.COLUMNS.map((column) => ({
                  key: column.status,
                  title: column.title,
                  status: column.status,
                  selector: { type: "system" as const, status: column.status },
                  selectionScope: "kanban" as const,
                  issues: board[column.status],
                  total: metadata?.totals.system[column.status] ?? board[column.status].length,
              }))
            : [];
        return [...customGroups, ...systemGroups];
    }, [board, customColumns, includeCustom, metadata?.totals, project?.name]);
    const rows = useMemo(
        () => flattenGroupedIssueRows(groups, (issue) => issue.id, true),
        [groups],
    );
    const loadedIssueIds = useMemo(
        () => groups.flatMap((group) => group.issues.map((issue) => issue.id)),
        [groups],
    );
    const selectionOrders = useMemo(
        () => ({
            kanban: groups
                .filter((group) => group.selectionScope === "kanban")
                .flatMap((group) => group.issues.map((issue) => issue.id)),
            "custom-kanban": groups
                .filter((group) => group.selectionScope === "custom-kanban")
                .flatMap((group) => group.issues.map((issue) => issue.id)),
        }),
        [groups],
    );
    const knownCollectionSize = useMemo(
        () =>
            feed.source === "base"
                ? groups.reduce((total, group) => total + group.total, 0)
                : undefined,
        [feed.source, groups],
    );
    const issuePositions = useMemo(() => {
        if (knownCollectionSize === undefined) {
            return new Map(loadedIssueIds.map((issueId, index) => [issueId, index + 1]));
        }
        const positions = new Map<string, number>();
        let laneOffset = 0;
        for (const group of groups) {
            const loadedOffset = Math.max(0, group.total - group.issues.length);
            group.issues.forEach((issue, index) => {
                positions.set(issue.id, laneOffset + loadedOffset + index + 1);
            });
            laneOffset += group.total;
        }
        return positions;
    }, [groups, knownCollectionSize, loadedIssueIds]);
    const issueRows = useMemo(() => {
        const indexes = new Map<string, number>();
        rows.forEach((row, index) => {
            if (row.kind === "issue") indexes.set(row.issue.id, index);
        });
        return indexes;
    }, [rows]);
    const stickyGroupRows = useMemo(
        () => rows.flatMap((row, index) => (row.kind === "group" ? [index] : [])),
        [rows],
    );

    return (
        <VirtualizedRows
            rows={rows}
            getRowKey={(row) => row.key}
            estimateSize={44}
            className="mt-2 min-h-0 flex-1 px-3 pb-2"
            contentRole="list"
            findIssueRow={(issueId) => issueRows.get(issueId) ?? -1}
            stickyRowIndexes={stickyGroupRows}
            status={{
                label: feed.fallbackPending
                    ? "Searching all board issues"
                    : feed.basePending
                      ? "Loading board issues"
                      : feed.baseError || feed.fallbackError
                        ? "Board issues could not be loaded. Retry is available."
                        : loadedIssueIds.length === 0
                          ? "No board issues"
                          : `${loadedIssueIds.length} loaded board issues`,
            }}
            renderRow={(row) => {
                if (row.kind === "group") {
                    return (
                        <div className="pb-1">
                            <ListGroupHeader group={row.group} />
                            {row.group.issues.length === 0 && (
                                <p className="px-12 py-3 text-[12px] text-neutral-600">No issues</p>
                            )}
                        </div>
                    );
                }
                if (row.kind === "group-end") {
                    return (
                        <div className="pb-2">
                            <BoardLanePagination selector={row.group.selector} />
                        </div>
                    );
                }
                return (
                    <div
                        role="listitem"
                        aria-posinset={issuePositions.get(row.issue.id)}
                        aria-setsize={knownCollectionSize}
                        className="overflow-hidden"
                    >
                        <IssueSelectionOrderProvider
                            issueIds={selectionOrders[row.group.selectionScope]}
                        >
                            <ListRow issue={row.issue} selectionScope={row.group.selectionScope} />
                        </IssueSelectionOrderProvider>
                    </div>
                );
            }}
        />
    );
}

function ListGroupHeader({ group }: { group: ListGroup }) {
    const statusColumn = group.status ? KanbanBoard.columnFor(group.status) : undefined;
    const GroupIcon = statusColumn?.icon ?? LuColumns3;

    return (
        <div className="flex h-9 items-center gap-2 rounded-lg bg-cement px-3">
            <GroupIcon
                className={cn("size-3.5 shrink-0", statusColumn?.titleBox ?? "text-violet-300")}
                aria-hidden
            />
            <span className="text-[13px] font-semibold text-neutral-200">{group.title}</span>
            <span className="text-[11px] font-medium text-neutral-500 tabular-nums">
                {group.issues.length}
                {group.total !== group.issues.length && (
                    <span className="text-neutral-600"> / {group.total}</span>
                )}
            </span>
        </div>
    );
}

function ListRow({ issue, selectionScope }: { issue: Issue; selectionScope: SelectionScope }) {
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const { selectedIds, isSelected, toggleSelection, handleSelectClick } =
        useIssueSelection(selectionScope);
    const selected = isSelected(issue.id);
    const statusGlyph = KanbanBoard.glyphFor(issue.status);
    const StatusIcon = statusGlyph.icon;
    const row = (
        <SelectableRow
            data-issue-id={issue.id}
            data-selection-scope={selectionScope}
            data-selected={selected}
            selected={selected}
            selectionActive={selectedIds.length > 0}
            selectionLabel={
                selected ? `Deselect issue ${issue.number}` : `Select issue ${issue.number}`
            }
            onToggleSelection={() => toggleSelection(issue.id)}
            className="min-h-11 w-full px-3 text-left"
        >
            <button
                type="button"
                onClick={(event) => {
                    if (handleSelectClick(event, issue.id)) return;
                    openIssue(issue.id);
                }}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left focus-visible:outline-none"
            >
                <span className="w-14 shrink-0 font-mono text-[11px] text-neutral-500">
                    {issue.number}
                </span>
                <StatusIcon className={cn("size-4 shrink-0", statusGlyph.titleBox)} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-100">
                    {issue.title}
                </span>
                <div className="hidden w-80 shrink-0 items-center justify-end lg:flex">
                    <IssueTags tags={issue.tags} className="flex-nowrap justify-end" />
                </div>
                <div className="flex w-16 shrink-0 items-center justify-end -space-x-1 overflow-hidden">
                    {issue.assignees.slice(0, 4).map((assignee) => (
                        <PlaygroundAvatar
                            key={assignee.id}
                            letter={assignee.name.charAt(0).toUpperCase()}
                            src={assignee.image}
                            tone={assignee.tone}
                            size="sm"
                            className="ring-1 ring-neutral-800"
                        />
                    ))}
                </div>
                {issue.createdAt && (
                    <span className="hidden w-14 shrink-0 text-right text-[11px] text-neutral-500 sm:block">
                        {shortDate(issue.createdAt)}
                    </span>
                )}
            </button>
        </SelectableRow>
    );

    return (
        <IssueDropdown issueId={issue.id} issue={issue.boardIssue}>
            {row}
        </IssueDropdown>
    );
}
