import { Prisma, prisma } from "@trymatcha/database";
import {
    filter_reference_tokens,
    GLOBAL_SEARCH_GROUP_CAP,
    type GlobalSearchIssueHit,
    type GlobalSearchMessageHit,
    type GlobalSearchMessageThread,
    type GlobalSearchResult,
    type LabelledReference,
    MIN_GLOBAL_SEARCH_QUERY_LENGTH,
    to_plain_text,
} from "@trymatcha/types";

import { escape_like } from "./service.board-issues";
import { MESSAGE_REFERENCE_INCLUDE } from "./service.message-references";
import PostContentService from "./service.post-content";

const CANDIDATE_LIMIT = GLOBAL_SEARCH_GROUP_CAP * 3;
const LABEL_MATCH_LIMIT = 50;
const SNIPPET_RADIUS = 48;
const SNIPPET_LENGTH = 140;
const NUMBER_QUERY = /^#?(\d{1,9})$/;

const DESCRIPTION_ONLY_RANK = 3;

type MessageKind = "issue-comment" | "project-chat" | "team-chat";

type IssueCandidate = { id: string; rank: number; matchedReference: boolean };
type MessageCandidate = {
    kind: MessageKind;
    id: string;
    createdAt: Date;
    matchedReference: boolean;
};
type IdRow = { id: string };

type SenderRow = { name: string | null; email: string } | null;

type LoadedMessage = {
    id: string;
    createdAt: Date;
    message: string;
    sender: SenderRow;
    references: LabelledReference[];
    thread: GlobalSearchMessageThread;
};

type LoadedMessageEntry = [string, LoadedMessage];

export function parse_issue_number(query: string): number | null {
    const digits = NUMBER_QUERY.exec(query)?.[1];
    return digits === undefined ? null : Number.parseInt(digits, 10);
}

export function issue_display_text(html: string): string {
    return filter_reference_tokens(PostContentService.to_plain_text(html), () => false);
}

export function build_snippet(text: string, query: string): string {
    const at = text.toLowerCase().indexOf(query.toLowerCase());
    const start = at < 0 ? 0 : Math.max(0, at - SNIPPET_RADIUS);
    const end = Math.min(text.length, start + SNIPPET_LENGTH);
    const lead = start > 0 ? "…" : "";
    const trail = end < text.length ? "…" : "";
    return `${lead}${text.slice(start, end)}${trail}`;
}

export function contains_query(text: string, query: string): boolean {
    return text.toLowerCase().includes(query.toLowerCase());
}

export function keep_issue_hit(
    candidate: { rank: number; matchedReference: boolean },
    display_description: string,
    query: string,
): boolean {
    if (candidate.rank !== DESCRIPTION_ONLY_RANK) return true;
    if (candidate.matchedReference) return true;
    return contains_query(display_description, query);
}

export function keep_message_hit(
    candidate: { matchedReference: boolean },
    display_message: string,
    query: string,
): boolean {
    if (candidate.matchedReference) return true;
    return contains_query(display_message, query);
}

export function sender_name(sender: SenderRow): string | null {
    return sender?.name ?? sender?.email ?? null;
}

function id_list(rows: IdRow[]): string[] {
    return rows.map((row) => row.id);
}

function reference_targets(member_ids: string[], issue_ids: string[], issue_column: string) {
    const targets: Prisma.Sql[] = [];
    if (member_ids.length) {
        targets.push(Prisma.sql`"r"."memberId" IN (${Prisma.join(member_ids)})`);
    }
    if (issue_ids.length) {
        targets.push(
            issue_column === "referencedIssueId"
                ? Prisma.sql`"r"."referencedIssueId" IN (${Prisma.join(issue_ids)})`
                : Prisma.sql`"r"."issueId" IN (${Prisma.join(issue_ids)})`,
        );
    }
    return targets.length ? Prisma.join(targets, " OR ") : null;
}

function description_reference_predicate(member_ids: string[], issue_ids: string[]) {
    const targets = reference_targets(member_ids, issue_ids, "referencedIssueId");
    if (!targets) return Prisma.sql`FALSE`;
    return Prisma.sql`EXISTS (
    SELECT 1 FROM "DescriptionReference" AS "r"
    WHERE "r"."issueId" = "i"."id" AND (${targets})
    )`;
}

function message_reference_predicate(
    fk_match: Prisma.Sql,
    member_ids: string[],
    issue_ids: string[],
) {
    const targets = reference_targets(member_ids, issue_ids, "issueId");
    if (!targets) return Prisma.sql`FALSE`;
    return Prisma.sql`EXISTS (
    SELECT 1 FROM "MessageReference" AS "r"
    WHERE ${fk_match} AND (${targets})
    )`;
}

export default class GlobalSearchService {
    static async search(
        project_id: string,
        viewer_id: string,
        query: string,
    ): Promise<GlobalSearchResult> {
        if (query.length < MIN_GLOBAL_SEARCH_QUERY_LENGTH) return { issues: [], messages: [] };

        const escaped = escape_like(query);
        const needle = `%${escaped}%`;
        const prefix = `${escaped}%`;
        const number = parse_issue_number(query);

        const [member_rows, label_issue_rows] = await Promise.all([
            prisma.$queryRaw<IdRow[]>`
        SELECT "m"."id"
        FROM "ProjectMember" AS "m"
        JOIN "User" AS "u" ON "u"."id" = "m"."userId"
        WHERE "m"."projectId" = ${project_id}
        AND ("u"."name" ILIKE ${needle} ESCAPE '\'
        OR "u"."email" ILIKE ${needle} ESCAPE '\')
        LIMIT ${LABEL_MATCH_LIMIT}
        `,
            prisma.$queryRaw<IdRow[]>`
        SELECT "i"."id"
        FROM "Issue" AS "i"
        WHERE "i"."projectId" = ${project_id}
        AND ((${number}::int IS NOT NULL AND "i"."number" = ${number}::int)
        OR "i"."title" ILIKE ${needle} ESCAPE '\')
        LIMIT ${LABEL_MATCH_LIMIT}
        `,
        ]);

        const member_ids = id_list(member_rows);
        const label_issue_ids = id_list(label_issue_rows);

        const [issue_candidates, message_candidates] = await Promise.all([
            GlobalSearchService.find_issue_candidates(project_id, {
                needle,
                prefix,
                number,
                member_ids,
                label_issue_ids,
            }),
            GlobalSearchService.find_message_candidates(project_id, viewer_id, {
                needle,
                member_ids,
                label_issue_ids,
            }),
        ]);

        const [issues, messages] = await Promise.all([
            GlobalSearchService.load_issues(issue_candidates, query),
            GlobalSearchService.load_messages(message_candidates, query),
        ]);

        return { issues, messages };
    }

    private static find_issue_candidates(
        project_id: string,
        input: {
            needle: string;
            prefix: string;
            number: number | null;
            member_ids: string[];
            label_issue_ids: string[];
        },
    ) {
        const references = description_reference_predicate(input.member_ids, input.label_issue_ids);

        return prisma.$queryRaw<IssueCandidate[]>`
      SELECT "i"."id",
      CASE
      WHEN ${input.number}::int IS NOT NULL AND "i"."number" = ${input.number}::int THEN 0
      WHEN "i"."title" ILIKE ${input.prefix} ESCAPE '\' THEN 1
      WHEN "i"."title" ILIKE ${input.needle} ESCAPE '\' THEN 2
      ELSE 3
      END::int AS "rank",
      (${references}) AS "matchedReference"
      FROM "Issue" AS "i"
      WHERE "i"."projectId" = ${project_id}
      AND ((${input.number}::int IS NOT NULL AND "i"."number" = ${input.number}::int)
      OR "i"."title" ILIKE ${input.needle} ESCAPE '\'
      OR "i"."description" ILIKE ${input.needle} ESCAPE '\'
      OR ${references})
      ORDER BY "rank" ASC, "i"."updatedAt" DESC, "i"."number" DESC
      LIMIT ${CANDIDATE_LIMIT}
      `;
    }

    private static find_message_candidates(
        project_id: string,
        viewer_id: string,
        input: { needle: string; member_ids: string[]; label_issue_ids: string[] },
    ) {
        const comment_references = message_reference_predicate(
            Prisma.sql`"r"."chatId" = "c"."id"`,
            input.member_ids,
            input.label_issue_ids,
        );
        const project_references = message_reference_predicate(
            Prisma.sql`"r"."projectChatId" = "p"."id"`,
            input.member_ids,
            input.label_issue_ids,
        );
        const team_references = message_reference_predicate(
            Prisma.sql`"r"."teamChatId" = "t"."id"`,
            input.member_ids,
            input.label_issue_ids,
        );

        return prisma.$queryRaw<MessageCandidate[]>`
      (SELECT 'issue-comment' AS "kind", "c"."id", "c"."createdAt",
      (${comment_references}) AS "matchedReference"
      FROM "Chat" AS "c"
      JOIN "Issue" AS "i" ON "i"."id" = "c"."issueId"
      WHERE "i"."projectId" = ${project_id}
      AND "c"."isDeleted" = false
      AND ("c"."message" ILIKE ${input.needle} ESCAPE '\' OR ${comment_references})
      ORDER BY "c"."createdAt" DESC, "c"."id" DESC
      LIMIT ${CANDIDATE_LIMIT})
      UNION ALL
      (SELECT 'project-chat' AS "kind", "p"."id", "p"."createdAt",
      (${project_references}) AS "matchedReference"
      FROM "ProjectChat" AS "p"
      WHERE "p"."projectId" = ${project_id}
      AND "p"."isDeleted" = false
      AND ("p"."message" ILIKE ${input.needle} ESCAPE '\' OR ${project_references})
      ORDER BY "p"."createdAt" DESC, "p"."id" DESC
      LIMIT ${CANDIDATE_LIMIT})
      UNION ALL
      (SELECT 'team-chat' AS "kind", "t"."id", "t"."createdAt",
      (${team_references}) AS "matchedReference"
      FROM "TeamChat" AS "t"
      JOIN "Team" AS "tm" ON "tm"."id" = "t"."teamId"
      WHERE "tm"."projectId" = ${project_id}
      AND "t"."isDeleted" = false
      AND ("t"."message" ILIKE ${input.needle} ESCAPE '\' OR ${team_references})
      AND EXISTS (
      SELECT 1 FROM "TeamMember" AS "mm"
      WHERE "mm"."teamId" = "t"."teamId" AND "mm"."userId" = ${viewer_id}
      )
      ORDER BY "t"."createdAt" DESC, "t"."id" DESC
      LIMIT ${CANDIDATE_LIMIT})
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${CANDIDATE_LIMIT}
      `;
    }

    private static async load_issues(
        candidates: IssueCandidate[],
        query: string,
    ): Promise<GlobalSearchIssueHit[]> {
        if (!candidates.length) return [];

        const rows = await prisma.issue.findMany({
            where: { id: { in: candidates.map((candidate) => candidate.id) } },
            select: { id: true, number: true, title: true, status: true, description: true },
        });
        const by_id = new Map(rows.map((row) => [row.id, row]));

        const hits: GlobalSearchIssueHit[] = [];
        for (const candidate of candidates) {
            const row = by_id.get(candidate.id);
            if (!row) continue;

            const description = issue_display_text(row.description);
            if (!keep_issue_hit(candidate, description, query)) continue;

            hits.push({
                id: row.id,
                number: row.number,
                title: row.title,
                status: row.status,
                snippet:
                    candidate.rank === DESCRIPTION_ONLY_RANK && description
                        ? build_snippet(description, query)
                        : null,
            });
            if (hits.length === GLOBAL_SEARCH_GROUP_CAP) break;
        }
        return hits;
    }

    private static async load_messages(
        candidates: MessageCandidate[],
        query: string,
    ): Promise<GlobalSearchMessageHit[]> {
        if (!candidates.length) return [];

        const ids_for = (kind: MessageKind) =>
            candidates.filter((candidate) => candidate.kind === kind).map(({ id }) => id);

        const [comments, project_chats, team_chats] = await Promise.all([
            GlobalSearchService.load_issue_comments(ids_for("issue-comment")),
            GlobalSearchService.load_project_chats(ids_for("project-chat")),
            GlobalSearchService.load_team_chats(ids_for("team-chat")),
        ]);

        const by_key = new Map([...comments, ...project_chats, ...team_chats]);

        const hits: GlobalSearchMessageHit[] = [];
        for (const candidate of candidates) {
            const row = by_key.get(`${candidate.kind}:${candidate.id}`);
            if (!row) continue;

            const message = to_plain_text(row.message, row.references);
            if (!keep_message_hit(candidate, message, query)) continue;

            hits.push({
                id: row.id,
                createdAt: row.createdAt.toISOString(),
                snippet: build_snippet(message, query),
                senderName: sender_name(row.sender),
                thread: row.thread,
            });
            if (hits.length === GLOBAL_SEARCH_GROUP_CAP) break;
        }
        return hits;
    }

    private static async load_issue_comments(ids: string[]): Promise<LoadedMessageEntry[]> {
        if (!ids.length) return [];
        const rows = await prisma.chat.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                createdAt: true,
                message: true,
                sender: { select: { name: true, email: true } },
                references: { include: MESSAGE_REFERENCE_INCLUDE },
                issue: { select: { id: true, number: true, title: true } },
            },
        });
        return rows.map((row) => [
            `issue-comment:${row.id}`,
            {
                ...row,
                references: row.references as LabelledReference[],
                thread: {
                    kind: "issue-comment",
                    issueId: row.issue.id,
                    issueNumber: row.issue.number,
                    issueTitle: row.issue.title,
                },
            },
        ]);
    }

    private static async load_project_chats(ids: string[]): Promise<LoadedMessageEntry[]> {
        if (!ids.length) return [];
        const rows = await prisma.projectChat.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                createdAt: true,
                message: true,
                sender: { select: { name: true, email: true } },
                references: { include: MESSAGE_REFERENCE_INCLUDE },
            },
        });
        return rows.map((row) => [
            `project-chat:${row.id}`,
            {
                ...row,
                references: row.references as LabelledReference[],
                thread: { kind: "project-chat" },
            },
        ]);
    }

    private static async load_team_chats(ids: string[]): Promise<LoadedMessageEntry[]> {
        if (!ids.length) return [];
        const rows = await prisma.teamChat.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                createdAt: true,
                message: true,
                sender: { select: { name: true, email: true } },
                references: { include: MESSAGE_REFERENCE_INCLUDE },
                team: { select: { id: true, name: true } },
            },
        });
        return rows.map((row) => [
            `team-chat:${row.id}`,
            {
                ...row,
                references: row.references as LabelledReference[],
                thread: { kind: "team-chat", teamId: row.team.id, teamName: row.team.name },
            },
        ]);
    }
}
