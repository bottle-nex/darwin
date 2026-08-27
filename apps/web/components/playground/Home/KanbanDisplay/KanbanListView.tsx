"use client";
import { KanbanColumnsIcon } from "@trymatcha/ui/icons";
import { useMemo, useState } from "react";

import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { type IssueTarget, useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import type { BoardLaneSelector } from "@/types/board";
import { type BoardState, type Issue, KanbanStatus } from "@/types/kanban";

import BoardLanePagination from "./BoardLanePagination";
import IssueListGroupHeader from "./IssueListGroupHeader";
import IssueListRow from "./IssueListRow";
import { flattenGroupedIssueRows } from "./virtualizedIssueRows";
import { VirtualizedRows } from "./VirtualizedRows";

type KanbanListViewProps = {
    board?: BoardState;
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
    createTarget?: IssueTarget;
};

export default function KanbanListView({ board }: KanbanListViewProps) {
    const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(() => new Set());
    const openCreate = useCreateIssueStore((state) => state.open);
    const project = useActiveProject();
    const projectId = project?.id;
    const feed = useBoardFeed(projectId);
    const { data: metadata } = useBoardColumns(projectId);
    const customColumns = useFilteredCustomColumns();
    const groups = useMemo<ListGroup[]>(() => {
        const customGroups = customColumns.map((column) => ({
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
            createTarget: {
                board: "custom" as const,
                columnId: column.id,
                columnTitle: column.title,
            },
        }));
        const systemGroups = board
            ? KanbanBoard.COLUMNS.map((column) => ({
                  key: column.status,
                  title: column.title,
                  status: column.status,
                  selector: { type: "system" as const, status: column.status },
                  selectionScope: "kanban" as const,
                  issues: board[column.status],
                  total: metadata?.totals.system[column.status] ?? board[column.status].length,
                  createTarget:
                      column.status === KanbanStatus.Todo
                          ? ({ board: "llm" as const } satisfies IssueTarget)
                          : undefined,
              }))
            : [];
        return [...customGroups, ...systemGroups];
    }, [board, customColumns, metadata?.totals, project?.name]);
    const rows = useMemo(
        () => flattenGroupedIssueRows(groups, (issue) => issue.id, true, collapsedGroupKeys),
        [collapsedGroupKeys, groups],
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

    function toggleGroup(groupKey: string) {
        setCollapsedGroupKeys((current) => {
            const next = new Set(current);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    }

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
                    const collapsed = collapsedGroupKeys.has(row.group.key);
                    const createTarget = row.group.createTarget;
                    const statusColumn = row.group.status
                        ? KanbanBoard.columnFor(row.group.status)
                        : undefined;
                    return (
                        <div className="pb-1">
                            <IssueListGroupHeader
                                title={row.group.title}
                                icon={statusColumn?.icon ?? KanbanColumnsIcon}
                                iconClassName={statusColumn?.titleBox}
                                count={row.group.issues.length}
                                total={row.group.total}
                                collapsed={collapsed}
                                onToggle={() => toggleGroup(row.group.key)}
                                onCreate={createTarget ? () => openCreate(createTarget) : undefined}
                            />
                            {!collapsed && row.group.issues.length === 0 && (
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
                            <IssueListRow
                                issueId={row.issue.id}
                                number={row.issue.number}
                                title={row.issue.title}
                                status={row.issue.status}
                                tags={row.issue.tags}
                                assignees={row.issue.assignees}
                                createdAt={row.issue.createdAt}
                                boardIssue={row.issue.boardIssue}
                                selectionScope={row.group.selectionScope}
                            />
                        </IssueSelectionOrderProvider>
                    </div>
                );
            }}
        />
    );
}
