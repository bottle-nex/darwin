import { IssueStatus } from "@trymatcha/database";
import { describe, expect, test } from "bun:test";

import {
    board_filters_schema,
    board_lane_query_schema,
    my_issues_query_schema,
} from "../controllers/issues/board-query.schema";
import BoardIssueService, { aggregate_custom_column_counts } from "./service.board-issues";

const base_issue = {
    id: "issue-1",
    number: 123,
    title: "Ship bounded board feeds",
    priority: 1,
    status: IssueStatus.Todo,
    customColumnId: null,
    createdAt: new Date("2026-08-22T09:30:00.000Z"),
    startDate: new Date("2026-08-21T12:00:00.000Z"),
    targetDate: new Date("2026-08-23T18:00:00.000Z"),
    createdById: "creator-1",
    assignees: [] as { id: string }[],
    tags: [{ id: "tag-1" }],
};

describe("board query schemas", () => {
    test("validates discriminated system and project custom lanes", () => {
        expect(
            board_lane_query_schema.parse({ lane_type: "system", status: IssueStatus.Todo }),
        ).toMatchObject({ lane_type: "system", status: IssueStatus.Todo, limit: 30 });
        expect(
            board_lane_query_schema.parse({ lane_type: "custom", column_id: "column-1" }),
        ).toMatchObject({ lane_type: "custom", column_id: "column-1", limit: 30 });
        expect(
            board_lane_query_schema.safeParse({ lane_type: "system", column_id: "column-1" })
                .success,
        ).toBe(false);
        expect(
            board_lane_query_schema.safeParse({ lane_type: "custom", status: IssueStatus.Todo })
                .success,
        ).toBe(false);
    });

    test("deduplicates bounded facets and rejects invalid dates and oversized filters", () => {
        expect(
            board_filters_schema.parse({
                assigneeIds: ["member-1", "member-1", "unassigned"],
                query: "  #123  ",
            }),
        ).toMatchObject({ assigneeIds: ["member-1", "unassigned"], query: "#123" });
        expect(
            board_filters_schema.parse({ tagIds: Array.from({ length: 101 }, () => "tag-1") })
                .tagIds,
        ).toEqual(["tag-1"]);

        expect(
            board_filters_schema.safeParse({
                tagIds: Array.from({ length: 101 }, (_, index) => `tag-${index}`),
            }).success,
        ).toBe(false);
        expect(board_filters_schema.safeParse({ query: "x".repeat(201) }).success).toBe(false);
        expect(
            board_filters_schema.safeParse({ createdAt: { from: "2026-02-30", to: null } }).success,
        ).toBe(false);
    });

    test("binds My Issues paging options into validated query input", () => {
        expect(
            my_issues_query_schema.parse({
                view: "assigned",
                group: "priority",
                order: "number",
            }),
        ).toMatchObject({ view: "assigned", group: "priority", order: "number", limit: 50 });
        expect(my_issues_query_schema.safeParse({ view: "all" }).success).toBe(false);
    });
});

describe("BoardIssueService", () => {
    test("sums every status bucket in a custom column total", () => {
        const totals = aggregate_custom_column_counts([
            { customColumnId: "column-1", _count: { _all: 3 } },
            { customColumnId: "column-1", _count: { _all: 2 } },
            { customColumnId: "column-2", _count: { _all: 4 } },
            { customColumnId: null, _count: { _all: 20 } },
        ]);

        expect(Object.fromEntries(totals)).toEqual({ "column-1": 5, "column-2": 4 });
    });

    test("keeps lane predicates isolated", () => {
        expect(
            BoardIssueService.lane_where("project-1", {
                lane_type: "system",
                status: IssueStatus.Todo,
            }),
        ).toEqual({
            projectId: "project-1",
            customColumnId: null,
            status: IssueStatus.Todo,
        });
        expect(
            BoardIssueService.lane_where("project-1", {
                lane_type: "custom",
                column_id: "column-1",
            }),
        ).toEqual({ projectId: "project-1", customColumnId: "column-1" });
        expect(BoardIssueService.issue_lane(base_issue)).toEqual({
            type: "system",
            status: IssueStatus.Todo,
        });
        expect(
            BoardIssueService.issue_lane({
                status: IssueStatus.Parked,
                customColumnId: "column-1",
            }),
        ).toEqual({ type: "custom", columnId: "column-1" });
    });

    test("rejects a cursor outside its project, lane, viewer, or filter scope", () => {
        const cursor = BoardIssueService.encode_created_cursor(
            { projectId: "project-1", lane: "system:Todo" },
            base_issue,
        );

        expect(
            BoardIssueService.decode_created_cursor(cursor, {
                projectId: "project-1",
                lane: "system:Todo",
            }),
        ).toEqual({ createdAt: base_issue.createdAt, id: base_issue.id });
        expect(() =>
            BoardIssueService.decode_created_cursor(cursor, {
                projectId: "project-1",
                lane: "system:Done",
            }),
        ).toThrow("Invalid cursor");
        expect(() =>
            BoardIssueService.decode_created_cursor(cursor, {
                projectId: "project-2",
                lane: "system:Todo",
            }),
        ).toThrow("Invalid cursor");
    });

    test("matches every local facet with AND between facets and OR within facets", () => {
        const filters = board_filters_schema.parse({
            statuses: [IssueStatus.Todo, IssueStatus.Done],
            priorities: [1, 2],
            assigneeIds: ["member-1", "unassigned"],
            creatorIds: ["creator-1"],
            tagIds: ["tag-1", "tag-2"],
            createdAt: { from: "2026-08-22", to: "2026-08-22" },
            startDate: { from: "2026-08-21", to: "2026-08-21" },
            targetDate: { from: "2026-08-23", to: "2026-08-23" },
            query: "#12",
        });

        expect(BoardIssueService.matches_filters(base_issue, filters)).toBe(true);
        expect(
            BoardIssueService.matches_filters(
                { ...base_issue, createdAt: new Date("2026-08-23T00:00:00.000Z") },
                filters,
            ),
        ).toBe(false);
        expect(
            BoardIssueService.matches_filters(
                { ...base_issue, assignees: [{ id: "member-1" }] },
                filters,
            ),
        ).toBe(true);
        expect(
            BoardIssueService.matches_filters(
                { ...base_issue, assignees: [{ id: "member-2" }] },
                filters,
            ),
        ).toBe(false);
        expect(
            BoardIssueService.matches_filters(
                {
                    ...base_issue,
                    status: IssueStatus.Parked,
                    customColumnId: "column-1",
                },
                filters,
                { skipStatus: true },
            ),
        ).toBe(true);
    });

    test.each([
        ["", true],
        ["   ", true],
        ["123", true],
        ["#123", true],
        ["#12", true],
        ["bounded", true],
        ["123x", false],
    ])("matches local query semantics for %j", (query, expected) => {
        const filters = board_filters_schema.parse({ query });
        expect(BoardIssueService.matches_filters(base_issue, filters)).toBe(expected);
    });

    test("paginates newest-first rows with equal timestamps without duplicates", () => {
        const createdAt = new Date("2026-08-22T09:30:00.000Z");
        const rows = ["d", "c", "b", "a"].map((id) => ({ id, createdAt }));
        const scope = { projectId: "project-1", lane: "system:Todo" };

        const first = BoardIssueService.created_page(rows.slice(0, 3), 2, scope);
        const second = BoardIssueService.created_page(rows.slice(2), 2, scope);

        expect(first.items.map((row) => row.id)).toEqual(["d", "c"]);
        expect(second.items.map((row) => row.id)).toEqual(["b", "a"]);
        expect(new Set([...first.items, ...second.items].map((row) => row.id)).size).toBe(4);
        expect(second.hasMore).toBe(false);
    });

    test.each([
        ["newest", ["newer", "none", "high", "older"]],
        ["oldest", ["older", "high", "none", "newer"]],
        ["number", ["newer", "none", "older", "high"]],
        ["priority", ["high", "newer", "older", "none"]],
    ] as const)("orders My Issues stably by %s", (order, expected) => {
        const rows = [
            {
                id: "older",
                createdAt: new Date("2026-08-20T00:00:00.000Z"),
                number: 20,
                priority: 3,
            },
            {
                id: "newer",
                createdAt: new Date("2026-08-23T00:00:00.000Z"),
                number: 40,
                priority: 3,
            },
            {
                id: "high",
                createdAt: new Date("2026-08-21T00:00:00.000Z"),
                number: 10,
                priority: 1,
            },
            {
                id: "none",
                createdAt: new Date("2026-08-22T00:00:00.000Z"),
                number: 30,
                priority: 0,
            },
        ];

        expect(BoardIssueService.sort_my_issue_rows(rows, order).map((row) => row.id)).toEqual([
            ...expected,
        ]);

        const filters = board_filters_schema.parse({ query: "bounded" });
        const scope = BoardIssueService.my_issues_scope("project-1", "viewer-1", {
            view: "assigned",
            group: "none",
            order,
            filters,
        });
        const cursor = BoardIssueService.encode_my_issue_cursor(scope, order, rows[0]);
        expect(BoardIssueService.decode_my_issue_cursor(cursor, scope, order).kind).toBe(order);
        expect(() =>
            BoardIssueService.decode_my_issue_cursor(
                cursor,
                { ...scope, group: "priority" },
                order,
            ),
        ).toThrow("Invalid cursor");
    });
});
