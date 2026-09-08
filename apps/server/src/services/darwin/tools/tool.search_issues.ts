import { Action } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import { MAX_GLOBAL_SEARCH_QUERY_LENGTH, MIN_GLOBAL_SEARCH_QUERY_LENGTH } from "@trydarwin/types";
import z from "zod";

import { BOARD_ISSUE_SELECT } from "../../service.board-issues";
import GlobalSearchService from "../../service.global-search";
import type { DarwinContext, DarwinTool } from "./tool.registry";
import { card_issue, MAX_CARDS } from "./tool.trim";

const input = z
    .object({
        query: z
            .string()
            .min(MIN_GLOBAL_SEARCH_QUERY_LENGTH)
            .max(MAX_GLOBAL_SEARCH_QUERY_LENGTH)
            .describe(
                "Words from the issue's title or body, or a bare issue number like 142. " +
                    "Keep it to the distinctive words — this is a substring match, not a question.",
            ),
    })
    .strict();

/**
 * Free-text search across the caller's project.
 *
 * `GlobalSearchService.search` takes the viewer id and does its own project scoping, so the two
 * ids it receives both come from `ctx`. Comment hits are returned without their bodies: they are
 * there to point the model at an issue, not to pull a whole thread into the context window.
 *
 * @example
 * await search_issues_tool.run({ query: "safari login" }, ctx);
 * // { issues: [{ number: 142, title: "Login fails on Safari", snippet: "…" }], comments: [...] }
 */
const search_issues_tool: DarwinTool<typeof input> = {
    name: "search_issues",
    description:
        "Find issues in the current project by words in their title, body or comments. Use this " +
        "when the user refers to a specific issue in their own words. Use find_issues instead " +
        "when they ask about a whole lane.",
    input,
    readOnly: true,
    action: Action.project.read,

    async run(args, ctx: DarwinContext) {
        const result = await GlobalSearchService.search(ctx.projectId, ctx.userId, args.query);

        // The search hit carries no tags or assignees; the card needs them, so the matched rows
        // are read back by id in one query rather than the card going without.
        const rows = result.issues.length
            ? await prisma.issue.findMany({
                  where: { id: { in: result.issues.map((hit) => hit.id) } },
                  select: BOARD_ISSUE_SELECT,
              })
            : [];
        const by_id = new Map(rows.map((row) => [row.id, row]));
        const items = result.issues
            .map((hit) => by_id.get(hit.id))
            .filter((row): row is NonNullable<typeof row> => Boolean(row))
            .slice(0, MAX_CARDS)
            .map(card_issue);

        return {
            output: {
                issues: result.issues,
                comments: result.messages
                    .filter((message) => message.thread.kind === "issue-comment")
                    .map((message) => ({
                        issueNumber:
                            message.thread.kind === "issue-comment"
                                ? message.thread.issueNumber
                                : null,
                        sender: message.senderName,
                        snippet: message.snippet,
                    })),
            },
            ...(items.length
                ? {
                      resource: () => ({
                          kind: "issues" as const,
                          items,
                          total: items.length,
                          hasMore: false,
                      }),
                  }
                : {}),
        };
    },
};

export default search_issues_tool;
