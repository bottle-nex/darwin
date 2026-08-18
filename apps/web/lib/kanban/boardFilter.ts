import type { BoardIssue } from "@/types/board";
import {
    EMPTY_FILTERS,
    FACET_KEYS,
    UNASSIGNED,
    type BoardFilters,
    type DateRangeFilter,
    type FacetKey,
} from "@/types/boardFilter";

function isFacetActive(filters: BoardFilters, key: FacetKey): boolean {
    const value = filters[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return value !== null && (value.from !== null || value.to !== null);
}

export function activeFacetKeys(filters: BoardFilters): FacetKey[] {
    return FACET_KEYS.filter((key) => isFacetActive(filters, key));
}

export function hasActiveFilters(filters: BoardFilters): boolean {
    return activeFacetKeys(filters).length > 0;
}

export function emptyFacetValue<K extends FacetKey>(key: K): BoardFilters[K] {
    return EMPTY_FILTERS[key];
}

function withinRange(value: string | null, range: DateRangeFilter | null): boolean {
    if (!range || (!range.from && !range.to)) return true;
    if (!value) return false;
    const day = value.slice(0, 10);
    if (range.from && day < range.from) return false;
    if (range.to && day > range.to) return false;
    return true;
}

function matchesAssignees(issue: BoardIssue, assigneeIds: string[]): boolean {
    if (assigneeIds.length === 0) return true;
    if (assigneeIds.includes(UNASSIGNED) && issue.assignees.length === 0) return true;
    return issue.assignees.some((assignee) => assigneeIds.includes(assignee.id));
}

function matchesQuery(issue: BoardIssue, query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return true;
    if (issue.title.toLowerCase().includes(needle)) return true;
    return `#${issue.number}`.includes(needle);
}

export function issueMatchesFilters(
    issue: BoardIssue,
    filters: BoardFilters,
    { skipStatus = false }: { skipStatus?: boolean } = {},
): boolean {
    if (!skipStatus && filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) {
        return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) return false;
    if (!matchesAssignees(issue, filters.assigneeIds)) return false;
    if (filters.creatorIds.length > 0 && !filters.creatorIds.includes(issue.creator?.id ?? "")) {
        return false;
    }
    if (filters.tagIds.length > 0 && !issue.tags.some((tag) => filters.tagIds.includes(tag.id))) {
        return false;
    }
    if (!withinRange(issue.createdAt, filters.createdAt)) return false;
    if (!withinRange(issue.startDate, filters.startDate)) return false;
    if (!withinRange(issue.targetDate, filters.targetDate)) return false;
    return matchesQuery(issue, filters.query);
}
