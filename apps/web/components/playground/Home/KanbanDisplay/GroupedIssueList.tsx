"use client";

import { closestCorners, DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

import { useGroupedIssueRows } from "@/hooks/issues/useGroupedIssueRows";
import { groupIcon } from "@/hooks/issues/useGroupOptions";
import { IssueSelectionOrderProvider } from "@/hooks/issues/useIssueSelection";
import {
    canDragIssue,
    groupDropId,
    useIssueDragHandlers,
} from "@/hooks/kanban/useIssueDragHandlers";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { IssueGroupBy } from "@/lib/kanban/issueGrouping";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import {
    type IssueSelectionScope,
    useIssueSelectionStore,
} from "@/store/issues/useIssueSelectionStore";
import type { BoardIssue } from "@/types/board";

import CardRenderer from "./cards/CardRenderer";
import IssueListGroupHeader from "./IssueListGroupHeader";
import IssueListRow from "./IssueListRow";
import FacetOptionGlyph from "./OptionsBar/KanbanOptionPanels/FacetOptionGlyph";
import { VirtualizedRows } from "./VirtualizedRows";
import type { AutoFillOptions, VirtualStatus } from "./virtualizedRows.type";

type GroupedIssueListProps = {
    issues: BoardIssue[];
    groupBy: IssueGroupBy;
    selectionScope: IssueSelectionScope;
    status: VirtualStatus;
    total?: number;
    emptyState?: ReactNode;
    autoFill?: AutoFillOptions;
    footer?: ReactNode;
};

/** A row that can be picked up and dropped into another group or another position. */
function SortableIssueRow({
    issueId,
    draggable,
    children,
}: {
    issueId: string;
    draggable: boolean;
    children: ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: issueId,
        disabled: !draggable,
    });

    if (!draggable) return children;

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...attributes}
            {...listeners}
            className={cn("touch-none", isDragging && "opacity-40")}
        >
            {children}
        </div>
    );
}

/** Group headers take drops too, so a row can be moved into a group it is not next to. */
function DroppableGroupHeader({ groupKey, children }: { groupKey: string; children: ReactNode }) {
    const { setNodeRef } = useDroppable({ id: groupDropId(groupKey) });
    return (
        <div ref={setNodeRef} className="py-1">
            {children}
        </div>
    );
}

export default function GroupedIssueList({
    issues,
    groupBy,
    selectionScope,
    status,
    total,
    emptyState,
    autoFill,
    footer,
}: GroupedIssueListProps) {
    const project = useActiveProject();
    const {
        groups,
        rows,
        stickyRowIndexes,
        issuePositions,
        loadedIssueIds,
        collapsedGroupKeys,
        toggleGroup,
        getRowKey,
        findIssueRow,
    } = useGroupedIssueRows(issues, groupBy);
    const drag = useIssueDragHandlers(groups, groupBy);
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    const fallbackIcon = groupIcon(groupBy);
    const selectedAt = (index: number) => {
        const row = rows[index];
        return row?.kind === "issue" && selectedIds.includes(row.issue.id);
    };

    return (
        <DndContext
            sensors={drag.sensors}
            collisionDetection={closestCorners}
            onDragStart={drag.onDragStart}
            onDragEnd={drag.onDragEnd}
            onDragCancel={drag.onDragCancel}
        >
            <IssueSelectionOrderProvider issueIds={loadedIssueIds}>
                <SortableContext items={loadedIssueIds} strategy={verticalListSortingStrategy}>
                    <VirtualizedRows
                        rows={rows}
                        getRowKey={getRowKey}
                        estimateSize={44}
                        className="mt-2 min-h-0 flex-1 px-3 pb-2"
                        contentRole="list"
                        findIssueRow={findIssueRow}
                        stickyRowIndexes={stickyRowIndexes}
                        emptyState={emptyState}
                        autoFill={autoFill}
                        footer={footer}
                        pinnedIssueId={drag.activeIssue?.id ?? null}
                        status={status}
                        renderRow={(row, index) => {
                            if (row.kind === "group") {
                                return (
                                    <DroppableGroupHeader groupKey={row.group.key}>
                                        <IssueListGroupHeader
                                            title={row.group.title}
                                            glyph={
                                                <FacetOptionGlyph
                                                    option={row.group.option}
                                                    fallbackIcon={fallbackIcon}
                                                />
                                            }
                                            count={row.group.issues.length}
                                            collapsed={collapsedGroupKeys.has(row.group.key)}
                                            onToggle={() => toggleGroup(row.group.key)}
                                        />
                                    </DroppableGroupHeader>
                                );
                            }
                            return (
                                <div
                                    role="listitem"
                                    aria-posinset={issuePositions[index]}
                                    aria-setsize={total ?? loadedIssueIds.length}
                                    className="overflow-hidden"
                                >
                                    <SortableIssueRow
                                        issueId={row.issue.id}
                                        draggable={canDragIssue(row.issue, groupBy)}
                                    >
                                        <IssueListRow
                                            issueId={row.issue.id}
                                            number={row.issue.number}
                                            title={row.issue.title}
                                            status={row.issue.status}
                                            tags={row.issue.tags}
                                            assignees={row.issue.assignees.map(
                                                KanbanMappers.toAssignee,
                                            )}
                                            createdAt={row.issue.createdAt}
                                            boardIssue={row.issue}
                                            selectionScope={selectionScope}
                                            joinedAbove={selectedAt(index - 1)}
                                            joinedBelow={selectedAt(index + 1)}
                                        />
                                    </SortableIssueRow>
                                </div>
                            );
                        }}
                    />
                </SortableContext>
            </IssueSelectionOrderProvider>
            <DragOverlay dropAnimation={null}>
                {drag.activeIssue && (
                    <CardRenderer
                        issue={KanbanMappers.toIssue(drag.activeIssue, project?.name ?? "")}
                        selectionScope={selectionScope}
                        preview
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}
