import type { BoardIssue } from "@/types/board";
import { AGENT_BOARD, type ListFacetKey, UNASSIGNED } from "@/types/boardFilter";

export const NO_GROUPING = "none";

/** A space's own columns. Not a filter facet — you can only be in one, and only inside a space. */
export const COLUMN_GROUPING = "columns";

export type IssueGroupBy = ListFacetKey | typeof NO_GROUPING | typeof COLUMN_GROUPING;

export type GroupedIssueField = Exclude<IssueGroupBy, typeof NO_GROUPING>;

export const ALL_ISSUES_GROUP_KEY = "all";

/** The column value for an issue that sits on a status lane rather than in a space column. */
export const NO_COLUMN = "no-column";

export const UNGROUPED_KEY = "ungrouped";

/** How far apart neighbours are when a card lands at the top or the bottom of a column. */
const POSITION_STEP = 1;

type SpaceOfColumn = (columnId: string) => string | undefined;

type GroupOption = { value: string; label: string };

export type IssueGroup<O> = {
    key: string;
    title: string;
    option: O | null;
    issues: BoardIssue[];
};

/** Manual position wins everywhere, so a card sits where it was last dropped. */
function byPosition(issues: BoardIssue[]): BoardIssue[] {
    return [...issues].sort(
        (left, right) => right.sortOrder - left.sortOrder || right.id.localeCompare(left.id),
    );
}

export function issueGroupValues(
    issue: BoardIssue,
    groupBy: GroupedIssueField,
    spaceOfColumn?: SpaceOfColumn,
): string[] {
    switch (groupBy) {
        case "statuses":
            return [issue.status];
        case "priorities":
            return [String(issue.priority)];
        case "assigneeIds":
            return issue.assignees.length > 0
                ? issue.assignees.map((assignee) => assignee.id)
                : [UNASSIGNED];
        case "creatorIds":
            return issue.creator ? [issue.creator.id] : [];
        case "tagIds":
            return issue.tags.map((tag) => tag.id);
        case "spaceIds": {
            if (issue.customColumnId === null) return [AGENT_BOARD];
            const spaceId = spaceOfColumn?.(issue.customColumnId);
            return spaceId === undefined ? [] : [spaceId];
        }
        case COLUMN_GROUPING:
            return [issue.customColumnId ?? NO_COLUMN];
    }
}

export function buildIssueGroups<O extends GroupOption>(
    issues: BoardIssue[],
    groupBy: IssueGroupBy,
    {
        options,
        ungroupedTitle,
        spaceOfColumn,
        keepEmpty = false,
    }: {
        options: O[];
        ungroupedTitle: string;
        spaceOfColumn?: SpaceOfColumn;
        /** Boards keep every option as a column, so there is always somewhere to drop. */
        keepEmpty?: boolean;
    },
): IssueGroup<O>[] {
    if (groupBy === NO_GROUPING) {
        return [{ key: ALL_ISSUES_GROUP_KEY, title: "", option: null, issues }];
    }

    const known = new Set(options.map((option) => option.value));
    const buckets = new Map<string, BoardIssue[]>();
    const ungrouped: BoardIssue[] = [];

    for (const issue of issues) {
        const values = issueGroupValues(issue, groupBy, spaceOfColumn).filter((value) =>
            known.has(value),
        );
        if (values.length === 0) {
            ungrouped.push(issue);
            continue;
        }
        for (const value of values) {
            const bucket = buckets.get(value);
            if (bucket) bucket.push(issue);
            else buckets.set(value, [issue]);
        }
    }

    const groups = options.flatMap((option) => {
        const bucket = buckets.get(option.value) ?? (keepEmpty ? [] : undefined);
        return bucket
            ? [{ key: option.value, title: option.label, option, issues: byPosition(bucket) }]
            : [];
    });

    return ungrouped.length > 0
        ? [
              ...groups,
              {
                  key: UNGROUPED_KEY,
                  title: ungroupedTitle,
                  option: null,
                  issues: byPosition(ungrouped),
              },
          ]
        : groups;
}

/**
 * The position a card takes when it is dropped between two others. Lists sort by
 * `sortOrder` descending, so `above` always holds the larger number.
 */
export function positionBetween(above: BoardIssue | undefined, below: BoardIssue | undefined) {
    if (above && below) return (above.sortOrder + below.sortOrder) / 2;
    if (above) return above.sortOrder - POSITION_STEP;
    if (below) return below.sortOrder + POSITION_STEP;
    return Date.now() / 1000;
}

/**
 * What dropping a card into a group's column changes about it. `null` means the
 * grouping cannot be written — a creator column takes no drops.
 */
export type GroupWrite =
    | { field: "status"; value: string }
    | { field: "priority"; value: number }
    | { field: "column"; value: string | null }
    | { field: "space"; value: string }
    | { field: "assignee"; value: string | null }
    | { field: "tag"; value: string | null }
    | null;

export function groupWriteFor(groupBy: GroupedIssueField, groupKey: string): GroupWrite {
    switch (groupBy) {
        case "statuses":
            return { field: "status", value: groupKey };
        case "priorities":
            return { field: "priority", value: Number(groupKey) };
        case COLUMN_GROUPING:
            return { field: "column", value: groupKey === NO_COLUMN ? null : groupKey };
        case "spaceIds":
            return groupKey === AGENT_BOARD
                ? { field: "column", value: null }
                : { field: "space", value: groupKey };
        case "assigneeIds":
            return { field: "assignee", value: groupKey === UNASSIGNED ? null : groupKey };
        case "tagIds":
            return { field: "tag", value: groupKey === UNGROUPED_KEY ? null : groupKey };
        case "creatorIds":
            return null;
    }
}
