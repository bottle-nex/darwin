import type { ServerIssueStatus } from "@/types/board";

export const UNASSIGNED = "unassigned";

/** The Agent board, as a value in the board facet. Spaces use their own ids. */
export const AGENT_BOARD = "agent";

export type DateRangeFilter = { from: string | null; to: string | null };

export type BoardFilters = {
    statuses: ServerIssueStatus[];
    priorities: number[];
    assigneeIds: string[];
    creatorIds: string[];
    tagIds: string[];
    spaceIds: string[];
    createdAt: DateRangeFilter | null;
    startDate: DateRangeFilter | null;
    targetDate: DateRangeFilter | null;
    query: string;
};

export const LIST_FACET_KEYS = [
    "statuses",
    "priorities",
    "assigneeIds",
    "creatorIds",
    "tagIds",
    "spaceIds",
] as const;

export const DATE_FACET_KEYS = ["createdAt", "startDate", "targetDate"] as const;

export const FACET_KEYS = [...LIST_FACET_KEYS, ...DATE_FACET_KEYS, "query"] as const;

export type ListFacetKey = (typeof LIST_FACET_KEYS)[number];
export type DateFacetKey = (typeof DATE_FACET_KEYS)[number];
export type FacetKey = (typeof FACET_KEYS)[number];

export const EMPTY_FILTERS: BoardFilters = {
    statuses: [],
    priorities: [],
    assigneeIds: [],
    creatorIds: [],
    tagIds: [],
    spaceIds: [],
    createdAt: null,
    startDate: null,
    targetDate: null,
    query: "",
};
