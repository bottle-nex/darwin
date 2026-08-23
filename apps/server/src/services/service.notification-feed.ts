import { createHash } from "node:crypto";
import { prisma, type Prisma } from "@trymatcha/database";
import {
    MEMBER_NOTIFICATION_TYPES,
    PROJECT_NOTIFICATION_TYPES,
    type CursorPage,
} from "@trymatcha/types";
import z from "zod";
import PaginationService, {
    DEFAULT_COLLECTION_PAGE_LIMIT,
    MAX_COLLECTION_PAGE_LIMIT,
} from "./service.pagination";

const feed_kind_schema = z.enum(["project", "member"]);

const feed_cursor_schema = z
    .object({
        v: z.literal(1),
        scope: z.string().length(64),
        kind: feed_kind_schema,
        createdAt: z.iso.datetime(),
        id: z.string().min(1).max(191),
    })
    .strict();

export type NotificationFeedScope =
    { kind: "project"; projectId: string; viewerId: string } | { kind: "member"; viewerId: string };

type NotificationFeedCursor = {
    scope: string;
    kind: NotificationFeedScope["kind"];
    createdAt: Date;
    id: string;
};

export type NotificationFeedQuery = {
    cursor?: NotificationFeedCursor;
    limit: number;
};

type NotificationFeedRow = { id: string; createdAt: Date };

export class InvalidNotificationCursorError extends Error {
    constructor() {
        super("Invalid cursor");
    }
}

function scope_digest(scope: NotificationFeedScope) {
    return createHash("sha256")
        .update(
            JSON.stringify([
                scope.kind,
                scope.kind === "project" ? scope.projectId : "",
                scope.viewerId,
            ]),
        )
        .digest("hex");
}

function decode_cursor(cursor: string): NotificationFeedCursor {
    if (cursor.length === 0 || cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
        throw new InvalidNotificationCursorError();
    }

    try {
        const payload = feed_cursor_schema.parse(
            JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
        );
        return {
            scope: payload.scope,
            kind: payload.kind,
            createdAt: new Date(payload.createdAt),
            id: payload.id,
        };
    } catch {
        throw new InvalidNotificationCursorError();
    }
}

const query_cursor_schema = z.string().transform((cursor, context) => {
    try {
        return decode_cursor(cursor);
    } catch {
        context.addIssue({ code: "custom", message: "Invalid cursor" });
        return z.NEVER;
    }
});

function scope_where(scope: NotificationFeedScope): Prisma.NotificationWhereInput {
    return scope.kind === "project"
        ? {
              userId: scope.viewerId,
              projectId: scope.projectId,
              type: { in: PROJECT_NOTIFICATION_TYPES },
          }
        : {
              userId: scope.viewerId,
              projectId: null,
              type: { in: MEMBER_NOTIFICATION_TYPES },
          };
}

export default class NotificationFeedService {
    static query_schema = z.object({
        cursor: query_cursor_schema.optional(),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(MAX_COLLECTION_PAGE_LIMIT)
            .default(DEFAULT_COLLECTION_PAGE_LIMIT),
    });

    static encode_cursor(scope: NotificationFeedScope, row: NotificationFeedRow) {
        return Buffer.from(
            JSON.stringify({
                v: 1,
                scope: scope_digest(scope),
                kind: scope.kind,
                createdAt: row.createdAt.toISOString(),
                id: row.id,
            }),
        ).toString("base64url");
    }

    static validate_cursor(
        cursor: NotificationFeedCursor | string | null | undefined,
        scope: NotificationFeedScope,
    ) {
        if (!cursor) return undefined;
        const decoded = typeof cursor === "string" ? decode_cursor(cursor) : cursor;
        if (decoded.kind !== scope.kind || decoded.scope !== scope_digest(scope)) {
            throw new InvalidNotificationCursorError();
        }
        return { createdAt: decoded.createdAt, id: decoded.id };
    }

    static cursor_where(cursor: NotificationFeedCursor | undefined, scope: NotificationFeedScope) {
        const decoded = NotificationFeedService.validate_cursor(cursor, scope);
        return decoded ? PaginationService.older_than_cursor(decoded) : {};
    }

    static create_page<T extends NotificationFeedRow>(
        rows: T[],
        limit: number,
        scope: NotificationFeedScope,
        unreadCount: number | undefined,
    ): CursorPage<T> & { unreadCount?: number } {
        const has_more = rows.length > limit;
        const items = has_more ? rows.slice(0, limit) : rows;
        const oldest_row = items.at(-1);

        return {
            items,
            nextCursor:
                has_more && oldest_row
                    ? NotificationFeedService.encode_cursor(scope, oldest_row)
                    : null,
            hasMore: has_more,
            ...(unreadCount === undefined ? {} : { unreadCount }),
        };
    }

    static async list(scope: NotificationFeedScope, query: NotificationFeedQuery) {
        const where = scope_where(scope);
        const cursor_filter = NotificationFeedService.cursor_where(query.cursor, scope);

        const [rows, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { ...where, ...cursor_filter },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
                take: query.limit + 1,
            }),
            query.cursor
                ? Promise.resolve(undefined)
                : prisma.notification.count({ where: { ...where, readAt: null } }),
        ]);

        return NotificationFeedService.create_page(rows, query.limit, scope, unreadCount);
    }

    static scope_filter(scope: NotificationFeedScope) {
        return scope_where(scope);
    }

    static unread_count(scope: NotificationFeedScope) {
        return prisma.notification.count({ where: { ...scope_where(scope), readAt: null } });
    }
}
