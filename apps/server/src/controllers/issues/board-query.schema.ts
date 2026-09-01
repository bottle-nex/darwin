import { IssueStatus } from "@trymatcha/database";
import z from "zod";

import {
    DEFAULT_COLLECTION_PAGE_LIMIT,
    MAX_COLLECTION_PAGE_LIMIT,
} from "../../services/service.pagination";

export const BOARD_SYSTEM_STATUSES = [
    IssueStatus.Todo,
    IssueStatus.Queued,
    IssueStatus.InProgress,
    IssueStatus.InReview,
    IssueStatus.Done,
    IssueStatus.Failed,
    IssueStatus.Cancelled,
] as const;

const MAX_FILTER_VALUES = 100;
const BOARD_LANE_PAGE_LIMIT = 30;

const cursor_schema = z
    .string()
    .min(1)
    .max(512)
    .regex(/^[A-Za-z0-9_-]+$/);
const page_query_schema = z.object({
    cursor: cursor_schema.optional(),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_COLLECTION_PAGE_LIMIT)
        .default(DEFAULT_COLLECTION_PAGE_LIMIT),
});
const lane_page_query_schema = page_query_schema.extend({
    limit: page_query_schema.shape.limit.default(BOARD_LANE_PAGE_LIMIT),
});

const identifier_list_schema = z
    .array(z.string().min(1).max(191))
    .transform((values) => [...new Set(values)])
    .refine((values) => values.length <= MAX_FILTER_VALUES);

const priority_list_schema = z
    .array(z.number().int().min(0).max(4))
    .transform((values) => [...new Set(values)])
    .refine((values) => values.length <= MAX_FILTER_VALUES);

const status_list_schema = z
    .array(z.enum(IssueStatus))
    .transform((values) => [...new Set(values)])
    .refine((values) => values.length <= MAX_FILTER_VALUES);

const utc_day_schema = z.iso.date();

const date_range_schema = z
    .object({
        from: utc_day_schema.nullable().default(null),
        to: utc_day_schema.nullable().default(null),
    })
    .strict()
    .refine((range) => !range.from || !range.to || range.from <= range.to);

export const board_filters_schema = z
    .object({
        statuses: status_list_schema.default([]),
        priorities: priority_list_schema.default([]),
        assigneeIds: identifier_list_schema.default([]),
        creatorIds: identifier_list_schema.default([]),
        tagIds: identifier_list_schema.default([]),
        spaceIds: identifier_list_schema.default([]),
        createdAt: date_range_schema.nullable().default(null),
        startDate: date_range_schema.nullable().default(null),
        targetDate: date_range_schema.nullable().default(null),
        query: z
            .string()
            .max(200)
            .transform((value) => value.trim())
            .default(""),
    })
    .strict();

const filters_query_schema = z.preprocess((value) => {
    if (value === undefined) return {};
    if (typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}, board_filters_schema);

const system_lane_schema = z
    .object({
        lane_type: z.literal("system"),
        status: z.enum(BOARD_SYSTEM_STATUSES),
        ...lane_page_query_schema.shape,
    })
    .strict();

const custom_lane_schema = z
    .object({
        lane_type: z.literal("custom"),
        column_id: z.string().min(1).max(191),
        ...lane_page_query_schema.shape,
    })
    .strict();

export const board_lane_selector_schema = z.discriminatedUnion("lane_type", [
    system_lane_schema,
    custom_lane_schema,
]);

export const board_lane_query_schema = board_lane_selector_schema;

export const board_search_query_schema = page_query_schema.extend({
    filters: filters_query_schema,
});

export const my_issues_query_schema = page_query_schema.extend({
    view: z.enum(["assigned", "created"]),
    group: z.enum(["status", "priority", "none"]),
    order: z.enum(["manual", "newest", "oldest", "priority", "number"]),
    filters: filters_query_schema,
});

export type BoardFilters = z.infer<typeof board_filters_schema>;
export type BoardLaneSelector =
    | { lane_type: "system"; status: (typeof BOARD_SYSTEM_STATUSES)[number] }
    | { lane_type: "custom"; column_id: string };
export type MyIssuesOrder = z.infer<typeof my_issues_query_schema>["order"];
export type MyIssuesQuery = z.infer<typeof my_issues_query_schema>;
