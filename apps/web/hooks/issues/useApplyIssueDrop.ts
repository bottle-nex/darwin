"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { useSpaceBoards } from "@/hooks/issues/useBoardColumns";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useListTags } from "@/hooks/tags/useListTags";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
    type GroupWrite,
    groupWriteFor,
    type IssueGroupBy,
    NO_GROUPING,
    positionBetween,
} from "@/lib/kanban/issueGrouping";
import { toast } from "@/lib/toast";
import type { BoardIssue } from "@/types/board";

import { boardLaneForIssue, patchBoardIssueCaches, reconcileBoardProject } from "./boardCache";

export type IssueDrop = {
    issue: BoardIssue;
    groupBy: IssueGroupBy;
    /** The group the card was dropped into. */
    groupKey: string;
    /** The cards it landed between, in display order. */
    above?: BoardIssue;
    below?: BoardIssue;
};

/**
 * One drop, applied. The column a card lands in decides which field is written —
 * status, priority, board column, assignee or label — and where it lands between
 * its neighbours decides its new position. The caches move first so the card stays
 * where it was dropped, and roll back if the write fails.
 */
export function useApplyIssueDrop() {
    const projectId = useActiveProject()?.id;
    const queryClient = useQueryClient();
    const updateIssue = useUpdateIssue();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();
    const spaceBoards = useSpaceBoards(projectId);
    const { data: members } = useProjectMembers(projectId);
    const { data: tags } = useListTags(projectId);

    function firstColumnOfSpace(spaceId: string) {
        return spaceBoards.find((space) => space.id === spaceId)?.columns[0]?.id;
    }

    function moved(issue: BoardIssue, write: NonNullable<GroupWrite>, sortOrder: number) {
        const next = { ...issue, sortOrder };
        switch (write.field) {
            case "status":
                return {
                    ...next,
                    status: write.value as BoardIssue["status"],
                    customColumnId: null,
                };
            case "priority":
                return { ...next, priority: write.value };
            case "column":
                return { ...next, customColumnId: write.value };
            case "space":
                return { ...next, customColumnId: firstColumnOfSpace(write.value) ?? null };
            case "assignee": {
                if (write.value === null) return { ...next, assignees: [] };
                const member = (members ?? []).find((row) => row.id === write.value);
                return member ? { ...next, assignees: [member] } : next;
            }
            case "tag": {
                if (write.value === null) return { ...next, tags: [] };
                const tag = (tags ?? []).find((row) => row.id === write.value);
                return tag && !issue.tags.some((row) => row.id === tag.id)
                    ? { ...next, tags: [...issue.tags, tag] }
                    : next;
            }
        }
    }

    return ({ issue, groupBy, groupKey, above, below }: IssueDrop) => {
        if (!projectId) return;
        const write = groupBy === NO_GROUPING ? null : groupWriteFor(groupBy, groupKey);
        if (!write && groupBy !== NO_GROUPING) return;

        const sortOrder = positionBetween(above, below);
        const onError = () => {
            reconcileBoardProject(queryClient, projectId);
            toast.error("Couldn't move the issue.");
        };

        patchBoardIssueCaches(
            queryClient,
            projectId,
            write ? moved(issue, write, sortOrder) : { ...issue, sortOrder },
            { beforeLane: boardLaneForIssue(issue) },
        );

        const patch = (
            fields: Omit<Parameters<typeof updateIssue.mutate>[0], "id" | "project_id">,
        ) => updateIssue.mutate({ id: issue.id, project_id: projectId, ...fields }, { onError });

        if (!write) {
            patch({ sort_order: sortOrder });
            return;
        }

        switch (write.field) {
            case "status":
                patch({
                    status: write.value as BoardIssue["status"],
                    custom_column_id: null,
                    sort_order: sortOrder,
                });
                return;
            case "priority":
                patch({ priority: write.value as 0 | 1 | 2 | 3 | 4, sort_order: sortOrder });
                return;
            case "column":
                patch({ custom_column_id: write.value, sort_order: sortOrder });
                return;
            case "space": {
                const columnId = firstColumnOfSpace(write.value);
                if (!columnId) {
                    toast.error("That board has no column to drop into.");
                    reconcileBoardProject(queryClient, projectId);
                    return;
                }
                patch({ custom_column_id: columnId, sort_order: sortOrder });
                return;
            }
            case "tag":
                patch({
                    tag_ids:
                        write.value === null
                            ? []
                            : [...new Set([...issue.tags.map((tag) => tag.id), write.value])],
                    sort_order: sortOrder,
                });
                return;
            case "assignee":
                patch({ sort_order: sortOrder });
                if (write.value === null) {
                    for (const assignee of issue.assignees) {
                        unassignIssue.mutate(
                            { id: issue.id, project_id: projectId, user_id: assignee.id },
                            { onError },
                        );
                    }
                    return;
                }
                if (issue.assignees.some((assignee) => assignee.id === write.value)) return;
                assignIssue.mutate(
                    { id: issue.id, project_id: projectId, user_id: write.value },
                    { onError },
                );
        }
    };
}
