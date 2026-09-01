"use client";

import {
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { useState } from "react";

import { isFieldEditable } from "@/components/playground/Issue/issueHelpers";
import { useApplyIssueDrop } from "@/hooks/issues/useApplyIssueDrop";
import type { FacetIssueGroup } from "@/hooks/issues/useIssueGroups";
import {
    COLUMN_GROUPING,
    groupWriteFor,
    type IssueGroupBy,
    NO_GROUPING,
} from "@/lib/kanban/issueGrouping";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { BoardIssue } from "@/types/board";

/** Droppable ids are prefixed so a group can be told apart from an issue. */
export const GROUP_DROP_PREFIX = "group:";

export function groupDropId(groupKey: string) {
    return `${GROUP_DROP_PREFIX}${groupKey}`;
}

/** Statuses the agent owns are closed to drops; every other column follows its own field. */
export function acceptsDrops(groupBy: IssueGroupBy, groupKey: string) {
    if (groupBy === NO_GROUPING) return true;
    if (!groupWriteFor(groupBy, groupKey)) return false;
    return groupBy !== "statuses" || KanbanBoard.isBridgeStatus(groupKey);
}

/** Where an issue sits on the board is the agent's to change while it is working. */
const LANE_GROUPINGS: IssueGroupBy[] = ["statuses", "spaceIds", COLUMN_GROUPING];

export function canDragIssue(issue: BoardIssue, groupBy: IssueGroupBy) {
    if (groupBy === NO_GROUPING) return true;
    if (groupWriteFor(groupBy, "") === null) return false;
    return !LANE_GROUPINGS.includes(groupBy) || isFieldEditable([issue], "status");
}

/**
 * Picking a card or row up and putting it down, shared by both layouts: the group
 * it lands in decides what is written, the cards around it decide where it sits.
 */
export function useIssueDragHandlers(groups: FacetIssueGroup[], groupBy: IssueGroupBy) {
    const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
    const applyDrop = useApplyIssueDrop();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    function issueById(issueId: string) {
        for (const group of groups) {
            const issue = group.issues.find((row) => row.id === issueId);
            if (issue) return issue;
        }
        return undefined;
    }

    function onDragStart(event: DragStartEvent) {
        setActiveIssue(issueById(String(event.active.id)) ?? null);
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveIssue(null);
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        const issue = issueById(activeId);
        if (!issue) return;

        const target = overId.startsWith(GROUP_DROP_PREFIX)
            ? groups.find((group) => group.key === overId.slice(GROUP_DROP_PREFIX.length))
            : groups.find((group) => group.issues.some((row) => row.id === overId));
        if (!target || !acceptsDrops(groupBy, target.key)) return;

        const others = target.issues.filter((row) => row.id !== activeId);
        const overIndex = others.findIndex((row) => row.id === overId);
        const insertAt = overIndex === -1 ? others.length : overIndex;
        applyDrop({
            issue,
            groupBy,
            groupKey: target.key,
            above: others[insertAt - 1],
            below: others[insertAt],
        });
    }

    return {
        sensors,
        activeIssue,
        onDragStart,
        onDragEnd,
        onDragCancel: () => setActiveIssue(null),
    };
}
