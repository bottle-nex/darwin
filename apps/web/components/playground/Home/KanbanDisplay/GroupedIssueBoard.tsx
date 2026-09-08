"use client";
import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { IssueStatus } from "@trydarwin/types";
import type { ReactNode } from "react";

import { type FacetIssueGroup, useIssueGroups } from "@/hooks/issues/useIssueGroups";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import { useReorderColumns } from "@/hooks/issues/useReorderColumns";
import { useCustomColumnActions } from "@/hooks/kanban/useCustomColumnActions";
import {
    acceptsDrops,
    canDragIssue,
    useIssueDragHandlers,
} from "@/hooks/kanban/useIssueDragHandlers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { COLUMN_GROUPING, type GroupedIssueField, NO_COLUMN } from "@/lib/kanban/issueGrouping";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { type IssueTarget, useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import type { IssueSelectionScope } from "@/store/issues/useIssueSelectionStore";
import type { BoardIssue, BoardLaneSelector, BoardScope } from "@/types/board";

import BoardLaneColumn from "./BoardLaneColumn";
import CardRenderer from "./cards/CardRenderer";
import IssueBoardColumn, { type ColumnActions } from "./IssueBoardColumn";
import type { AutoFillOptions } from "./virtualizedRows.type";

type GroupedIssueBoardProps = {
    issues: BoardIssue[];
    groupBy: GroupedIssueField;
    selectionScope: IssueSelectionScope;
    scope?: BoardScope;
    /** Show just this group, full width. Ignored when no group has that key. */
    focusGroupKey?: string | null;
    /**
     * Set on a board pane, where a group is one of the server's own lanes and can
     * page on its own. My Issues has no lanes, so it pages through `columnAutoFill`.
     */
    lanePaged?: boolean;
    columnAutoFill?: AutoFillOptions;
    /** Mounted below the board — the lane loaders that keep the pool filling. */
    footer?: ReactNode;
};

/** The server lane a group stands for, when it stands for one. */
function laneFor(groupBy: GroupedIssueField, groupKey: string): BoardLaneSelector | null {
    if (groupBy === "statuses") {
        return { type: "system", status: groupKey as BoardIssue["status"] };
    }
    if (groupBy === COLUMN_GROUPING && groupKey !== NO_COLUMN) {
        return { type: "custom", columnId: groupKey };
    }
    return null;
}

function createTargetFor(
    group: FacetIssueGroup,
    groupBy: GroupedIssueField,
): IssueTarget | undefined {
    if (groupBy === "statuses" && group.key === IssueStatus.Todo) return { board: "llm" };
    if (groupBy === COLUMN_GROUPING && group.key !== NO_COLUMN) {
        return { board: "custom", columnId: group.key, columnTitle: group.title };
    }
    return undefined;
}

/**
 * The board over a grouping: one column per group value, every value kept on screen
 * so there is always somewhere to drop. Dropping a card writes the field its column
 * stands for and the position it landed at.
 */
export default function GroupedIssueBoard({
    issues,
    groupBy,
    selectionScope,
    scope,
    focusGroupKey,
    lanePaged = false,
    columnAutoFill,
    footer,
}: GroupedIssueBoardProps) {
    const project = useActiveProject();
    const allGroups = useIssueGroups(issues, groupBy, { scope, keepEmpty: true });
    const focused = allGroups.find((group) => group.key === focusGroupKey);
    const groups = focused ? [focused] : allGroups;
    const { sensors, activeIssue, onDragStart, onDragEnd, onDragCancel } = useIssueDragHandlers(
        groups,
        groupBy,
    );
    const reorderColumns = useReorderColumns();
    const { removeColumn, renameColumn } = useCustomColumnActions();
    const openCreate = useCreateIssueStore((state) => state.open);
    const ownsColumns = groupBy === COLUMN_GROUPING && scope?.kind === "space";
    const loadedIssueIds = groups.flatMap((group) => group.issues.map((issue) => issue.id));
    const columnKeys = groups.map((group) => group.key).filter((key) => key !== NO_COLUMN);

    function moveColumn(columnId: string, direction: -1 | 1) {
        if (!project?.id || scope?.kind !== "space") return;
        const from = columnKeys.indexOf(columnId);
        const to = from + direction;
        if (from === -1 || to < 0 || to >= columnKeys.length) return;
        const columnIds = [...columnKeys];
        columnIds.splice(to, 0, ...columnIds.splice(from, 1));
        reorderColumns.mutate({
            project_id: project.id,
            space_id: scope.spaceId,
            column_ids: columnIds,
        });
    }

    function columnActionsFor(group: FacetIssueGroup): ColumnActions | undefined {
        if (!ownsColumns || group.key === NO_COLUMN) return undefined;
        const index = columnKeys.indexOf(group.key);
        return {
            onRename: (label) => renameColumn(group.key, label),
            onDelete: () => removeColumn(group.key),
            onMove: (direction) => moveColumn(group.key, direction),
            canMoveLeft: index > 0,
            canMoveRight: index >= 0 && index < columnKeys.length - 1,
        };
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
        >
            <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
                <div
                    data-kanban-scroll-row
                    className="flex min-h-0 flex-1 items-start gap-x-2 gap-y-4 overflow-x-auto px-3 pt-3 pb-3"
                >
                    <SortableContext items={loadedIssueIds} strategy={verticalListSortingStrategy}>
                        {groups.map((group) => {
                            const props = {
                                group,
                                selectionScope,
                                droppable: acceptsDrops(groupBy, group.key),
                                canDragCard: (issue: BoardIssue) => canDragIssue(issue, groupBy),
                                columnActions: columnActionsFor(group),
                                fullWidth: Boolean(focused),
                                onCreate: (() => {
                                    const target = createTargetFor(group, groupBy);
                                    return target ? () => openCreate(target) : undefined;
                                })(),
                            };
                            const lane = lanePaged ? laneFor(groupBy, group.key) : null;
                            return lane ? (
                                <BoardLaneColumn key={group.key} lane={lane} {...props} />
                            ) : (
                                <IssueBoardColumn
                                    key={group.key}
                                    autoFill={columnAutoFill}
                                    {...props}
                                />
                            );
                        })}
                    </SortableContext>
                </div>
            </IssueSelectionOrderProvider>
            {footer}
            <DragOverlay dropAnimation={null}>
                {activeIssue && (
                    <CardRenderer
                        issue={KanbanMappers.toIssue(activeIssue, project?.name ?? "")}
                        selectionScope={selectionScope}
                        preview
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}
