import { Action } from "@trydarwin/access-control";
import { ActivitySurface, prisma } from "@trydarwin/database";
import z from "zod";

import { BOARD_ISSUE_SELECT } from "../../service.board-issues";
import ChatHistoryService from "../../service.chat-history";
import { issue_display_text } from "../../service.global-search";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";
import { card_issue, truncate } from "./tool.trim";

const COMMENT_LIMIT = 10;
const ACTIVITY_LIMIT = 10;
const COMMENT_MAX_CHARS = 500;
/** The card shows a few; the rest are a click away on the issue itself. */
const CARD_COMMENT_LIMIT = 5;

const input = z
    .object({
        issue_number: z
            .number()
            .int()
            .min(1)
            .describe("The issue's number as shown on the board, e.g. 142 for #142."),
        include_comments: z
            .boolean()
            .default(true)
            .describe("Set false when you only need the issue's own fields."),
    })
    .strict();

/**
 * Read one issue in full, with its discussion.
 *
 * This is the only tool that returns an untruncated body — `find_issues` and `search_issues`
 * deliberately cut it to 280 characters, because their rows are resent on every later loop
 * iteration. A single issue is read once, so it can afford the detail.
 *
 * Comments are the largest thing that can enter the context window, so they are capped hard at
 * ten, 500 characters each, and reduced to plain text.
 *
 * @example
 * await get_issue_tool.run({ issue_number: 142 }, ctx);
 * // { number: 142, title: "Login fails on Safari", description: "…", comments: [...] }
 */
const get_issue_tool: DarwinTool<typeof input> = {
    name: "get_issue",
    description:
        "Read one issue in full: its whole body, dates, pull request, and the recent discussion " +
        "on it. Use this whenever the user asks about a specific issue, or when you need to know " +
        "what was already said before answering.",
    input,
    readOnly: true,
    action: Action.project.read,

    async run(args, ctx: DarwinContext) {
        const issue = await prisma.issue.findFirst({
            where: { projectId: ctx.projectId, number: args.issue_number },
            select: { ...BOARD_ISSUE_SELECT, customColumn: { select: { label: true } } },
        });
        if (!issue) {
            throw new DarwinToolError(`There is no issue #${args.issue_number} in this project.`);
        }

        const [comments, activity] = await Promise.all([
            args.include_comments
                ? ChatHistoryService.list_issue_comments(issue.id, ctx.userId, {
                      limit: COMMENT_LIMIT,
                  })
                : null,
            prisma.issueActivity.findMany({
                where: { issueId: issue.id, surface: { not: ActivitySurface.Audit } },
                orderBy: { seq: "desc" },
                take: ACTIVITY_LIMIT,
                select: {
                    type: true,
                    createdAt: true,
                    actorUser: { select: { name: true } },
                },
            }),
        ]);

        const comment_rows =
            comments?.items.map((row) => ({
                by: row.sender?.name ?? row.sender?.email ?? "someone",
                at: row.createdAt.toISOString().slice(0, 10),
                text: truncate(issue_display_text(row.message), COMMENT_MAX_CHARS),
            })) ?? [];
        const body = issue_display_text(issue.description);

        return {
            output: {
                number: issue.number,
                title: issue.title,
                description: body,
                status: issue.status,
                column: issue.customColumn?.label ?? null,
                priority: issue.priority,
                assignees: issue.assignees.map((user) => user.name ?? user.email),
                tags: issue.tags.map((tag) => tag.name),
                createdBy: issue.creator?.name ?? issue.creator?.email ?? null,
                startDate: issue.startDate?.toISOString().slice(0, 10) ?? null,
                targetDate: issue.targetDate?.toISOString().slice(0, 10) ?? null,
                pullRequest: issue.prUrl ? { url: issue.prUrl, title: issue.prTitle } : null,
                comments: args.include_comments ? comment_rows : null,
                recentActivity: activity.map((row) => ({
                    what: row.type,
                    by: row.actorUser?.name ?? "the agent",
                    at: row.createdAt.toISOString().slice(0, 10),
                })),
            },
            resource: () => ({
                kind: "issue",
                item: { ...card_issue(issue), column: issue.customColumn?.label ?? null },
                description: body,
                comments: comment_rows.slice(0, CARD_COMMENT_LIMIT),
            }),
        };
    },
};

export default get_issue_tool;
