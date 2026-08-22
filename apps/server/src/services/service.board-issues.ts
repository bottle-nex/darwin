import { createHash } from "node:crypto";
import { IssueStatus, Prisma, prisma } from "@trymatcha/database";
import z from "zod";
import type {
    BoardFilters,
    BoardLaneSelector,
    MyIssuesOrder,
    MyIssuesQuery,
} from "../controllers/issues/board-query.schema";
import { BOARD_SYSTEM_STATUSES } from "../controllers/issues/board-query.schema";
import PaginationService from "./service.pagination";

export const BOARD_ISSUE_SELECT = {
    id: true,
    number: true,
    title: true,
    description: true,
    priority: true,
    status: true,
    customColumnId: true,
    createdAt: true,
    startDate: true,
    targetDate: true,
    prUrl: true,
    prNumber: true,
    prTitle: true,
    creator: {
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    },
    assignees: {
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    },
    tags: {
        select: {
            id: true,
            name: true,
            color: true,
        },
    },
} satisfies Prisma.IssueSelect;

export type BoardIssueRow = Prisma.IssueGetPayload<{ select: typeof BOARD_ISSUE_SELECT }>;
export type IssueLane =
    { type: "system"; status: IssueStatus } | { type: "custom"; columnId: string };

const created_cursor_schema = z
    .object({
        v: z.literal(1),
        scope: z.string().length(64),
        kind: z.literal("created"),
        createdAt: z.iso.datetime(),
        id: z.string().min(1).max(191),
    })
    .strict();

const my_issue_cursor_schema = z.discriminatedUnion("kind", [
    created_cursor_schema.extend({ kind: z.literal("newest") }),
    created_cursor_schema.extend({ kind: z.literal("oldest") }),
    z
        .object({
            v: z.literal(1),
            scope: z.string().length(64),
            kind: z.literal("number"),
            number: z.number().int().positive(),
            id: z.string().min(1).max(191),
        })
        .strict(),
    z
        .object({
            v: z.literal(1),
            scope: z.string().length(64),
            kind: z.literal("priority"),
            priority: z.number().int().min(0).max(4),
            number: z.number().int().positive(),
            id: z.string().min(1).max(191),
        })
        .strict(),
]);

type CreatedRow = { id: string; createdAt: Date };
type MyIssueRow = CreatedRow & { number: number; priority: number };
type FilterableIssue = MyIssueRow & {
    title: string;
    status: IssueStatus;
    customColumnId: string | null;
    startDate: Date | string | null;
    targetDate: Date | string | null;
    createdById: string;
    assignees: { id: string }[];
    tags: { id: string }[];
};

type ScopeInput = Record<string, unknown>;

const PRIORITY_RANK = new Map([1, 2, 3, 4, 0].map((priority, rank) => [priority, rank]));
const PRIORITY_SQL = Prisma.sql`CASE "i"."priority"
    WHEN 1 THEN 0
    WHEN 2 THEN 1
    WHEN 3 THEN 2
    WHEN 4 THEN 3
    ELSE 4
END`;

function encode_payload(payload: object) {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function aggregate_custom_column_counts(
    lane_counts: readonly {
        customColumnId: string | null;
        _count: { _all: number };
    }[],
) {
    const totals = new Map<string, number>();
    for (const entry of lane_counts) {
        if (entry.customColumnId === null) continue;
        totals.set(
            entry.customColumnId,
            (totals.get(entry.customColumnId) ?? 0) + entry._count._all,
        );
    }
    return totals;
}

export class InvalidBoardCursorError extends Error {
    constructor() {
        super("Invalid cursor");
    }
}

function decode_payload(cursor: string) {
    if (cursor.length === 0 || cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
        throw new InvalidBoardCursorError();
    }
    try {
        return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    } catch {
        throw new InvalidBoardCursorError();
    }
}

function scope_digest(scope: ScopeInput) {
    return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

function utc_day(value: Date | string) {
    return (typeof value === "string" ? value : value.toISOString()).slice(0, 10);
}

function next_utc_day(day: string) {
    const value = new Date(`${day}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + 1);
    return value;
}

export function escape_like(value: string) {
    return value.replace(/[\\%_]/g, "\\$&");
}

export default class BoardIssueService {
    static find_project_column(
        project_id: string,
        column_id: string,
    ): Promise<{ id: string } | null> {
        return prisma.customColumn.findFirst({
            where: { id: column_id, projectId: project_id },
            select: { id: true },
        });
    }

    static async get_board_metadata(project_id: string, viewer_id: string) {
        const [columns, personal_orders, lane_counts] = await Promise.all([
            prisma.customColumn.findMany({
                where: { projectId: project_id },
                orderBy: { order: "asc" },
                select: { id: true, label: true, order: true },
            }),
            prisma.customColumnOrder.findMany({
                where: { userId: viewer_id, projectId: project_id },
                select: { columnId: true, order: true },
            }),
            prisma.issue.groupBy({
                by: ["status", "customColumnId"],
                where: { projectId: project_id },
                _count: { _all: true },
            }),
        ]);

        const personal_order_by_column = new Map(
            personal_orders.map((order) => [order.columnId, order.order]),
        );
        const ordered_columns = [...columns].sort((left, right) => {
            const left_order = personal_order_by_column.get(left.id);
            const right_order = personal_order_by_column.get(right.id);
            if (left_order !== undefined && right_order !== undefined) {
                return left_order - right_order;
            }
            if (left_order !== undefined) return -1;
            if (right_order !== undefined) return 1;
            return left.order - right.order;
        });
        const system_count_by_status = new Map(
            lane_counts
                .filter((entry) => entry.customColumnId === null)
                .map((entry) => [entry.status, entry._count._all]),
        );
        const custom_count_by_column = aggregate_custom_column_counts(lane_counts);

        return {
            columns: ordered_columns,
            totals: {
                system: Object.fromEntries(
                    BOARD_SYSTEM_STATUSES.map((status) => [
                        status,
                        system_count_by_status.get(status) ?? 0,
                    ]),
                ),
                custom: Object.fromEntries(
                    ordered_columns.map((column) => [
                        column.id,
                        custom_count_by_column.get(column.id) ?? 0,
                    ]),
                ),
            },
        };
    }

    static lane_scope(project_id: string, selector: BoardLaneSelector) {
        return {
            projectId: project_id,
            lane:
                selector.lane_type === "system"
                    ? `system:${selector.status}`
                    : `custom:${selector.column_id}`,
        };
    }

    static lane_where(project_id: string, selector: BoardLaneSelector): Prisma.IssueWhereInput {
        if (selector.lane_type === "system") {
            return {
                projectId: project_id,
                customColumnId: null,
                status: selector.status,
            };
        }
        return { projectId: project_id, customColumnId: selector.column_id };
    }

    static issue_lane(issue: { status: IssueStatus; customColumnId: string | null }): IssueLane {
        return issue.customColumnId
            ? ({ type: "custom", columnId: issue.customColumnId } as const)
            : ({ type: "system", status: issue.status } as const);
    }

    static encode_created_cursor(scope: ScopeInput, row: CreatedRow) {
        return encode_payload({
            v: 1,
            scope: scope_digest(scope),
            kind: "created",
            createdAt: row.createdAt.toISOString(),
            id: row.id,
        });
    }

    static decode_created_cursor(cursor: string, scope: ScopeInput) {
        const parsed = created_cursor_schema.safeParse(decode_payload(cursor));
        if (!parsed.success || parsed.data.scope !== scope_digest(scope)) {
            throw new InvalidBoardCursorError();
        }
        return { createdAt: new Date(parsed.data.createdAt), id: parsed.data.id };
    }

    static matches_filters(
        issue: FilterableIssue,
        filters: BoardFilters,
        { skipStatus = false }: { skipStatus?: boolean } = {},
    ) {
        if (!skipStatus && filters.statuses.length && !filters.statuses.includes(issue.status)) {
            return false;
        }
        if (filters.priorities.length && !filters.priorities.includes(issue.priority)) return false;

        if (filters.assigneeIds.length) {
            const matches_unassigned =
                filters.assigneeIds.includes("unassigned") && issue.assignees.length === 0;
            const matches_assignee = issue.assignees.some((assignee) =>
                filters.assigneeIds.includes(assignee.id),
            );
            if (!matches_unassigned && !matches_assignee) return false;
        }

        if (filters.creatorIds.length && !filters.creatorIds.includes(issue.createdById)) {
            return false;
        }
        if (filters.tagIds.length && !issue.tags.some((tag) => filters.tagIds.includes(tag.id))) {
            return false;
        }

        const date_values = [
            [issue.createdAt, filters.createdAt],
            [issue.startDate, filters.startDate],
            [issue.targetDate, filters.targetDate],
        ] as const;
        for (const [value, range] of date_values) {
            if (!range || (!range.from && !range.to)) continue;
            if (!value) return false;
            const day = utc_day(value);
            if (range.from && day < range.from) return false;
            if (range.to && day > range.to) return false;
        }

        const query = filters.query.toLowerCase();
        if (!query) return true;
        return issue.title.toLowerCase().includes(query) || `#${issue.number}`.includes(query);
    }

    static created_page<T extends CreatedRow>(rows: T[], limit: number, scope: ScopeInput) {
        const has_more = rows.length > limit;
        const items = has_more ? rows.slice(0, limit) : rows;
        const last = items.at(-1);
        return {
            items,
            nextCursor:
                has_more && last ? BoardIssueService.encode_created_cursor(scope, last) : null,
            hasMore: has_more,
        };
    }

    static async list_lane(
        project_id: string,
        selector: BoardLaneSelector,
        cursor: string | undefined,
        limit: number,
    ) {
        const scope = BoardIssueService.lane_scope(project_id, selector);
        const decoded = cursor ? BoardIssueService.decode_created_cursor(cursor, scope) : undefined;
        const where = BoardIssueService.lane_where(project_id, selector);
        const [rows, total] = await Promise.all([
            prisma.issue.findMany({
                where: decoded
                    ? { AND: [where, PaginationService.older_than_cursor(decoded)] }
                    : where,
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: limit + 1,
                select: BOARD_ISSUE_SELECT,
            }),
            decoded ? Promise.resolve(undefined) : prisma.issue.count({ where }),
        ]);
        return {
            ...BoardIssueService.created_page(rows, limit, scope),
            ...(total === undefined ? {} : { total }),
        };
    }

    static search_scope(project_id: string, filters: BoardFilters) {
        return { projectId: project_id, filters };
    }

    static async search_board(
        project_id: string,
        filters: BoardFilters,
        cursor: string | undefined,
        limit: number,
    ) {
        const scope = BoardIssueService.search_scope(project_id, filters);
        const decoded = cursor ? BoardIssueService.decode_created_cursor(cursor, scope) : undefined;
        const base_predicates = BoardIssueService.filter_predicates(project_id, filters, {
            customColumnsIgnoreStatus: true,
        });
        const predicates = [...base_predicates];
        if (decoded) {
            predicates.push(Prisma.sql`(
                "i"."createdAt" < ${decoded.createdAt}
                OR ("i"."createdAt" = ${decoded.createdAt} AND "i"."id" < ${decoded.id})
            )`);
        }

        const where = Prisma.sql`WHERE ${Prisma.join(predicates, " AND ")}`;
        return prisma.$transaction(
            async (transaction) => {
                const [page_rows, count_rows] = await Promise.all([
                    transaction.$queryRaw<MyIssueRow[]>`
                        SELECT "i"."id", "i"."createdAt", "i"."number", "i"."priority"
                        FROM "Issue" AS "i"
                        ${where}
                        ORDER BY "i"."createdAt" DESC, "i"."id" DESC
                        LIMIT ${limit + 1}
                    `,
                    decoded
                        ? Promise.resolve(undefined)
                        : transaction.$queryRaw<{ total: bigint }[]>`
                              SELECT COUNT(*)::bigint AS "total"
                              FROM "Issue" AS "i"
                              WHERE ${Prisma.join(base_predicates, " AND ")}
                          `,
                ]);

                const has_more = page_rows.length > limit;
                const cursor_rows = has_more ? page_rows.slice(0, limit) : page_rows;
                const full_rows = await BoardIssueService.load_rows(
                    cursor_rows.map((row) => row.id),
                    transaction,
                );
                const last = cursor_rows.at(-1);
                return {
                    items: full_rows,
                    nextCursor:
                        has_more && last
                            ? BoardIssueService.encode_created_cursor(scope, last)
                            : null,
                    hasMore: has_more,
                    ...(count_rows ? { total: Number(count_rows[0]?.total ?? 0) } : {}),
                };
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
        );
    }

    static my_issues_scope(
        project_id: string,
        viewer_id: string,
        query: Pick<MyIssuesQuery, "view" | "group" | "order" | "filters">,
    ) {
        return {
            projectId: project_id,
            viewerId: viewer_id,
            view: query.view,
            group: query.group,
            order: query.order,
            filters: query.filters,
        };
    }

    static async list_my_issues(project_id: string, viewer_id: string, query: MyIssuesQuery) {
        const scope = BoardIssueService.my_issues_scope(project_id, viewer_id, query);
        const decoded = query.cursor
            ? BoardIssueService.decode_my_issue_cursor(query.cursor, scope, query.order)
            : undefined;
        const base_predicates = BoardIssueService.filter_predicates(project_id, query.filters);
        base_predicates.push(
            query.view === "assigned"
                ? Prisma.sql`EXISTS (
                    SELECT 1 FROM "_IssueAssignees" AS "assigned"
                    WHERE "assigned"."A" = "i"."id" AND "assigned"."B" = ${viewer_id}
                )`
                : Prisma.sql`"i"."createdById" = ${viewer_id}`,
        );
        const page_predicates = [...base_predicates];
        if (decoded) page_predicates.push(BoardIssueService.my_cursor_predicate(decoded));

        const order = BoardIssueService.my_order_sql(query.order);
        return prisma.$transaction(
            async (transaction) => {
                const [rows, count_rows] = await Promise.all([
                    transaction.$queryRaw<MyIssueRow[]>(Prisma.sql`
                        SELECT "i"."id", "i"."createdAt", "i"."number", "i"."priority"
                        FROM "Issue" AS "i"
                        WHERE ${Prisma.join(page_predicates, " AND ")}
                        ORDER BY ${order}
                        LIMIT ${query.limit + 1}
                    `),
                    decoded
                        ? Promise.resolve(undefined)
                        : transaction.$queryRaw<{ total: bigint }[]>(Prisma.sql`
                              SELECT COUNT(*)::bigint AS "total"
                              FROM "Issue" AS "i"
                              WHERE ${Prisma.join(base_predicates, " AND ")}
                          `),
                ]);
                const page_rows = rows.length > query.limit ? rows.slice(0, query.limit) : rows;
                const full_rows = await BoardIssueService.load_rows(
                    page_rows.map((row) => row.id),
                    transaction,
                );
                const last = page_rows.at(-1);
                const has_more = rows.length > query.limit;
                return {
                    items: full_rows,
                    nextCursor:
                        has_more && last
                            ? BoardIssueService.encode_my_issue_cursor(scope, query.order, last)
                            : null,
                    hasMore: has_more,
                    ...(count_rows ? { total: Number(count_rows[0]?.total ?? 0) } : {}),
                };
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
        );
    }

    static sort_my_issue_rows<T extends MyIssueRow>(rows: T[], order: MyIssuesOrder) {
        return [...rows].sort((left, right) => {
            if (order === "newest" || order === "oldest") {
                const difference = left.createdAt.getTime() - right.createdAt.getTime();
                const directed = order === "newest" ? -difference : difference;
                return (
                    directed ||
                    (order === "newest"
                        ? right.id.localeCompare(left.id)
                        : left.id.localeCompare(right.id))
                );
            }
            if (order === "number") {
                return right.number - left.number || right.id.localeCompare(left.id);
            }
            const rank =
                (PRIORITY_RANK.get(left.priority) ?? 5) - (PRIORITY_RANK.get(right.priority) ?? 5);
            return rank || right.number - left.number || right.id.localeCompare(left.id);
        });
    }

    private static async load_rows(
        ids: string[],
        client: Prisma.TransactionClient | typeof prisma = prisma,
    ) {
        if (!ids.length) return [];
        const rows = await client.issue.findMany({
            where: { id: { in: ids } },
            select: BOARD_ISSUE_SELECT,
        });
        const by_id = new Map(rows.map((row) => [row.id, row]));
        return ids
            .map((id) => by_id.get(id))
            .filter((row): row is NonNullable<typeof row> => Boolean(row));
    }

    private static filter_predicates(
        project_id: string,
        filters: BoardFilters,
        { customColumnsIgnoreStatus = false }: { customColumnsIgnoreStatus?: boolean } = {},
    ) {
        const predicates: Prisma.Sql[] = [Prisma.sql`"i"."projectId" = ${project_id}`];
        if (filters.statuses.length) {
            const status_predicate = Prisma.sql`"i"."status"::text IN (${Prisma.join(
                filters.statuses,
            )})`;
            predicates.push(
                customColumnsIgnoreStatus
                    ? Prisma.sql`("i"."customColumnId" IS NOT NULL OR ${status_predicate})`
                    : status_predicate,
            );
        }
        if (filters.priorities.length) {
            predicates.push(Prisma.sql`"i"."priority" IN (${Prisma.join(filters.priorities)})`);
        }
        if (filters.assigneeIds.length) {
            const member_ids = filters.assigneeIds.filter((id) => id !== "unassigned");
            const choices: Prisma.Sql[] = [];
            if (filters.assigneeIds.includes("unassigned")) {
                choices.push(Prisma.sql`NOT EXISTS (
                    SELECT 1 FROM "_IssueAssignees" AS "unassigned"
                    WHERE "unassigned"."A" = "i"."id"
                )`);
            }
            if (member_ids.length) {
                choices.push(Prisma.sql`EXISTS (
                    SELECT 1 FROM "_IssueAssignees" AS "assignee"
                    WHERE "assignee"."A" = "i"."id"
                    AND "assignee"."B" IN (${Prisma.join(member_ids)})
                )`);
            }
            predicates.push(Prisma.sql`(${Prisma.join(choices, " OR ")})`);
        }
        if (filters.creatorIds.length) {
            predicates.push(Prisma.sql`"i"."createdById" IN (${Prisma.join(filters.creatorIds)})`);
        }
        if (filters.tagIds.length) {
            predicates.push(Prisma.sql`EXISTS (
                SELECT 1 FROM "_IssueToTag" AS "tag"
                WHERE "tag"."A" = "i"."id"
                AND "tag"."B" IN (${Prisma.join(filters.tagIds)})
            )`);
        }
        BoardIssueService.add_date_predicates(predicates, "createdAt", filters.createdAt);
        BoardIssueService.add_date_predicates(predicates, "startDate", filters.startDate);
        BoardIssueService.add_date_predicates(predicates, "targetDate", filters.targetDate);
        if (filters.query) {
            const needle = `%${escape_like(filters.query.toLowerCase())}%`;
            predicates.push(Prisma.sql`(
                LOWER("i"."title") LIKE ${needle} ESCAPE '\\'
                OR ('#' || "i"."number"::text) LIKE ${needle} ESCAPE '\\'
            )`);
        }
        return predicates;
    }

    private static add_date_predicates(
        predicates: Prisma.Sql[],
        field: "createdAt" | "startDate" | "targetDate",
        range: BoardFilters["createdAt"],
    ) {
        if (!range) return;
        const column = Prisma.raw(`"i"."${field}"`);
        if (range.from) {
            predicates.push(Prisma.sql`${column} >= ${new Date(`${range.from}T00:00:00.000Z`)}`);
        }
        if (range.to) {
            predicates.push(Prisma.sql`${column} < ${next_utc_day(range.to)}`);
        }
    }

    static encode_my_issue_cursor(scope: ScopeInput, order: MyIssuesOrder, row: MyIssueRow) {
        const common = { v: 1, scope: scope_digest(scope), kind: order, id: row.id };
        if (order === "newest" || order === "oldest") {
            return encode_payload({ ...common, createdAt: row.createdAt.toISOString() });
        }
        if (order === "number") return encode_payload({ ...common, number: row.number });
        return encode_payload({
            ...common,
            priority: row.priority,
            number: row.number,
        });
    }

    static decode_my_issue_cursor(cursor: string, scope: ScopeInput, order: MyIssuesOrder) {
        const parsed = my_issue_cursor_schema.safeParse(decode_payload(cursor));
        if (
            !parsed.success ||
            parsed.data.scope !== scope_digest(scope) ||
            parsed.data.kind !== order
        ) {
            throw new InvalidBoardCursorError();
        }
        return parsed.data;
    }

    private static my_cursor_predicate(cursor: z.infer<typeof my_issue_cursor_schema>): Prisma.Sql {
        if (cursor.kind === "newest") {
            const created_at = new Date(cursor.createdAt);
            return Prisma.sql`(
                "i"."createdAt" < ${created_at}
                OR ("i"."createdAt" = ${created_at} AND "i"."id" < ${cursor.id})
            )`;
        }
        if (cursor.kind === "oldest") {
            const created_at = new Date(cursor.createdAt);
            return Prisma.sql`(
                "i"."createdAt" > ${created_at}
                OR ("i"."createdAt" = ${created_at} AND "i"."id" > ${cursor.id})
            )`;
        }
        if (cursor.kind === "number") {
            return Prisma.sql`(
                "i"."number" < ${cursor.number}
                OR ("i"."number" = ${cursor.number} AND "i"."id" < ${cursor.id})
            )`;
        }
        const rank = PRIORITY_RANK.get(cursor.priority) ?? 5;
        return Prisma.sql`(
            ${PRIORITY_SQL} > ${rank}
            OR (
                ${PRIORITY_SQL} = ${rank}
                AND (
                    "i"."number" < ${cursor.number}
                    OR ("i"."number" = ${cursor.number} AND "i"."id" < ${cursor.id})
                )
            )
        )`;
    }

    private static my_order_sql(order: MyIssuesOrder) {
        if (order === "newest") return Prisma.sql`"i"."createdAt" DESC, "i"."id" DESC`;
        if (order === "oldest") return Prisma.sql`"i"."createdAt" ASC, "i"."id" ASC`;
        if (order === "number") return Prisma.sql`"i"."number" DESC, "i"."id" DESC`;
        return Prisma.sql`${PRIORITY_SQL} ASC, "i"."number" DESC, "i"."id" DESC`;
    }
}
