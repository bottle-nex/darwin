import { createHash } from "node:crypto";

import { prisma } from "@trydarwin/database";
import type { CursorPage, ReactionSummary } from "@trydarwin/types";
import z from "zod";

import MessageReactionService from "./service.message-reactions";
import { MESSAGE_REFERENCE_INCLUDE } from "./service.message-references";
import PaginationService, {
    DEFAULT_COLLECTION_PAGE_LIMIT,
    MAX_COLLECTION_PAGE_LIMIT,
} from "./service.pagination";

export const CHAT_HISTORY_INCLUDE = {
    sender: true,
    repliedTo: { include: { sender: true } },
    references: { include: MESSAGE_REFERENCE_INCLUDE },
} as const;

const history_kind_schema = z.enum(["project-chat", "team-chat", "issue-comment"]);
const history_cursor_schema = z
    .object({
        v: z.literal(1),
        scope: z.string().length(64),
        kind: history_kind_schema,
        createdAt: z.iso.datetime(),
        id: z.string().min(1).max(191),
    })
    .strict();

export type ChatHistoryScope = {
    kind: z.infer<typeof history_kind_schema>;
    parentId: string;
    viewerId: string;
};

type ChatHistoryCursor = {
    scope: string;
    kind: ChatHistoryScope["kind"];
    createdAt: Date;
    id: string;
};

type ChatHistoryQuery = {
    cursor?: ChatHistoryCursor;
    limit: number;
};

type ChatHistoryRow = {
    id: string;
    createdAt: Date;
};

type ChatHistoryItem<T extends ChatHistoryRow> = T & { reactions: ReactionSummary[] };

export class InvalidChatHistoryCursorError extends Error {
    constructor() {
        super("Invalid cursor");
    }
}

function scope_digest(scope: ChatHistoryScope) {
    return createHash("sha256")
        .update(JSON.stringify([scope.kind, scope.parentId, scope.viewerId]))
        .digest("hex");
}

function decode_cursor(cursor: string): ChatHistoryCursor {
    if (cursor.length === 0 || cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
        throw new InvalidChatHistoryCursorError();
    }

    try {
        const payload = history_cursor_schema.parse(
            JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
        );
        return {
            scope: payload.scope,
            kind: payload.kind,
            createdAt: new Date(payload.createdAt),
            id: payload.id,
        };
    } catch {
        throw new InvalidChatHistoryCursorError();
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

export default class ChatHistoryService {
    static query_schema = z.object({
        cursor: query_cursor_schema.optional(),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(MAX_COLLECTION_PAGE_LIMIT)
            .default(DEFAULT_COLLECTION_PAGE_LIMIT),
    });

    static encode_cursor(scope: ChatHistoryScope, row: ChatHistoryRow) {
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
        cursor: ChatHistoryCursor | string | null | undefined,
        scope: ChatHistoryScope,
    ) {
        if (!cursor) return undefined;
        const decoded = typeof cursor === "string" ? decode_cursor(cursor) : cursor;
        if (decoded.kind !== scope.kind || decoded.scope !== scope_digest(scope)) {
            throw new InvalidChatHistoryCursorError();
        }
        return { createdAt: decoded.createdAt, id: decoded.id };
    }

    static cursor_where(cursor: ChatHistoryCursor | undefined, scope: ChatHistoryScope) {
        const decoded = ChatHistoryService.validate_cursor(cursor, scope);
        return decoded ? PaginationService.older_than_cursor(decoded) : {};
    }

    static create_page<T extends ChatHistoryRow>(
        rows: T[],
        limit: number,
        scope: ChatHistoryScope,
        reaction_summaries = new Map<string, ReactionSummary[]>(),
    ): CursorPage<ChatHistoryItem<T>> {
        const has_more = rows.length > limit;
        const bounded_rows = has_more ? rows.slice(0, limit) : rows;
        const oldest_row = bounded_rows.at(-1);
        const items = bounded_rows
            .map((row) => ({
                ...row,
                reactions: reaction_summaries.get(row.id) ?? [],
            }))
            .reverse();

        return {
            items,
            nextCursor:
                has_more && oldest_row ? ChatHistoryService.encode_cursor(scope, oldest_row) : null,
            hasMore: has_more,
        };
    }

    static async list_project_chats(
        project_id: string,
        viewer_id: string,
        query: ChatHistoryQuery,
    ) {
        const scope = {
            kind: "project-chat",
            parentId: project_id,
            viewerId: viewer_id,
        } as const;
        const rows = await prisma.projectChat.findMany({
            where: {
                projectId: project_id,
                ...ChatHistoryService.cursor_where(query.cursor, scope),
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: query.limit + 1,
            include: CHAT_HISTORY_INCLUDE,
        });
        const visible_rows = rows.slice(0, query.limit);
        const reactions = await MessageReactionService.project_chat_summaries(
            visible_rows.map((row) => row.id),
            viewer_id,
        );
        return ChatHistoryService.create_page(rows, query.limit, scope, reactions);
    }

    static async list_team_chats(team_id: string, viewer_id: string, query: ChatHistoryQuery) {
        const scope = {
            kind: "team-chat",
            parentId: team_id,
            viewerId: viewer_id,
        } as const;
        const rows = await prisma.teamChat.findMany({
            where: {
                teamId: team_id,
                ...ChatHistoryService.cursor_where(query.cursor, scope),
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: query.limit + 1,
            include: CHAT_HISTORY_INCLUDE,
        });
        const visible_rows = rows.slice(0, query.limit);
        const reactions = await MessageReactionService.team_chat_summaries(
            visible_rows.map((row) => row.id),
            viewer_id,
        );
        return ChatHistoryService.create_page(rows, query.limit, scope, reactions);
    }

    static async list_issue_comments(issue_id: string, viewer_id: string, query: ChatHistoryQuery) {
        const scope = {
            kind: "issue-comment",
            parentId: issue_id,
            viewerId: viewer_id,
        } as const;
        const rows = await prisma.chat.findMany({
            where: {
                issueId: issue_id,
                ...ChatHistoryService.cursor_where(query.cursor, scope),
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: query.limit + 1,
            include: CHAT_HISTORY_INCLUDE,
        });
        const visible_rows = rows.slice(0, query.limit);
        const reactions = await MessageReactionService.chat_summaries(
            visible_rows.map((row) => row.id),
            viewer_id,
        );
        return ChatHistoryService.create_page(rows, query.limit, scope, reactions);
    }
}
