import { Action } from "@trydarwin/access-control";
import { IssueStatus } from "@trydarwin/database";
import { ISSUE_LANE_NAME } from "@trydarwin/types";
import z from "zod";

import type { BoardFilters } from "../../../controllers/issues/board-query.schema";
import BoardIssueService, { AGENT_BOARD } from "../../service.board-issues";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";
import { card_issue, MAX_CARDS, trim_issue } from "./tool.trim";

const ME = "me";
const UNASSIGNED = "unassigned";

const STATUS_LEGEND = Object.entries(ISSUE_LANE_NAME)
    .map(([status, label]) => `${status} (${label})`)
    .join(", ");

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const range = z
    .object({ from: day.optional(), to: day.optional() })
    .strict()
    .describe("A date window. Give `from`, `to`, or both.");

const input = z
    .object({
        statuses: z
            .array(z.enum(IssueStatus))
            .max(8)
            .optional()
            .describe(`Lanes to include. Omit for every lane. One of: ${STATUS_LEGEND}.`),
        assignees: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe(
                `Who the issue is assigned to. Use "${ME}" for the person you are talking to, ` +
                    `"${UNASSIGNED}" for nobody, or a member's id. For anyone else by name, read ` +
                    "the project first to find their id.",
            ),
        creators: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe(`Who filed the issue. "${ME}" or a member's id.`),
        tag_ids: z.array(z.string().min(1)).max(20).optional(),
        priorities: z
            .array(z.number().int().min(0).max(4))
            .max(5)
            .optional()
            .describe("1 Urgent, 2 High, 3 Normal, 4 Low, 0 none."),
        boards: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe(
                `Space ids to limit to, or "${AGENT_BOARD}" for issues with no board column — ` +
                    "the ones the coding agent works.",
            ),
        due: range.optional().describe("Filter on the target date. Use this for what is overdue."),
        starts: range.optional().describe("Filter on the start date."),
        created: range.optional().describe("Filter on when the issue was filed."),
        text: z
            .string()
            .max(200)
            .optional()
            .describe("Match the title or an issue number. Not a full-text search of bodies."),
        limit: z.number().int().min(1).max(50).default(20),
    })
    .strict();

function to_range(value: { from?: string; to?: string } | undefined) {
    if (!value || (!value.from && !value.to)) return null;
    return { from: value.from ?? null, to: value.to ?? null };
}

/** `me` is resolved here so the model never has to look the caller up before asking a question. */
function resolve_people(
    values: string[] | undefined,
    ctx: DarwinContext,
    allow_unassigned: boolean,
) {
    return (values ?? []).map((value) => {
        if (value === ME) return ctx.userId;
        if (value === UNASSIGNED && allow_unassigned) return UNASSIGNED;
        return value;
    });
}

/**
 * One filtered read of the whole board.
 *
 * This replaced a per-lane reader, which forced seven calls for any question that spanned the
 * board — "assigned to Priya", "everything urgent", "what is overdue" — and simply could not
 * answer some of them at all. It runs the same filter the board UI runs, so anything a person can
 * narrow to on screen is one call here.
 *
 * @example
 * await find_issues_tool.run({ assignees: ["me"], statuses: ["Todo", "InProgress"] }, ctx);
 * // { total: 4, hasMore: false, issues: [{ number: 12, title: "…" }] }
 */
const find_issues_tool: DarwinTool<typeof input> = {
    name: "find_issues",
    description:
        "Find issues on the board, filtered. Every filter is optional and they combine, so one " +
        "call answers questions like what is assigned to someone, what is unassigned, what is " +
        "urgent, what is overdue, or what is tagged a certain way. Call this once with the right " +
        "filters rather than reading lanes one at a time.",
    input,
    readOnly: true,
    action: Action.project.read,

    async run(args, ctx: DarwinContext) {
        if (args.due?.from && args.due.to && args.due.from > args.due.to) {
            throw new DarwinToolError("The start of a date window has to be before its end.");
        }

        const filters: BoardFilters = {
            statuses: args.statuses ?? [],
            priorities: args.priorities ?? [],
            assigneeIds: resolve_people(args.assignees, ctx, true),
            creatorIds: resolve_people(args.creators, ctx, false),
            tagIds: args.tag_ids ?? [],
            spaceIds: args.boards ?? [],
            createdAt: to_range(args.created),
            startDate: to_range(args.starts),
            targetDate: to_range(args.due),
            query: args.text?.trim() ?? "",
        };

        const page = await BoardIssueService.search_board(
            ctx.projectId,
            filters,
            undefined,
            args.limit,
        );

        const total = page.total ?? page.items.length;
        return {
            output: { total, hasMore: page.hasMore, issues: page.items.map(trim_issue) },
            // No card for an empty result — "nothing matched" is a sentence, not a card.
            ...(page.items.length
                ? {
                      resource: () => ({
                          kind: "issues" as const,
                          items: page.items.slice(0, MAX_CARDS).map(card_issue),
                          total,
                          hasMore: page.hasMore,
                      }),
                  }
                : {}),
        };
    },
};

export default find_issues_tool;
