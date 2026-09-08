import { Action } from "@trydarwin/access-control";
import { IssueStatus, prisma } from "@trydarwin/database";
import { ISSUE_LANE_NAME } from "@trydarwin/types";
import z from "zod";

import IssueService, { type IssuePatch } from "../../service.issue";
import { to_issue_html } from "./tool.body";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";
import { card_issue } from "./tool.trim";

const STATUS_LEGEND = Object.entries(ISSUE_LANE_NAME)
    .filter(([status]) => status !== IssueStatus.Parked)
    .map(([status, label]) => `${status} (${label})`)
    .join(", ");

const iso_day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const input = z
    .object({
        issue_number: z
            .number()
            .int()
            .min(1)
            .describe("The issue's number as shown on the board, e.g. 142 for #142."),
        title: z.string().min(1).max(200).optional(),
        description: z
            .string()
            .max(20000)
            .optional()
            .describe("Replaces the whole body in plain prose. Omit to leave it untouched."),
        status: z.enum(IssueStatus).optional().describe(`One of: ${STATUS_LEGEND}.`),
        column_id: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Move the issue into a board column from get_project_context. Use this when the " +
                    "user names a space or board to move it to.",
            ),
        priority: z
            .number()
            .int()
            .min(0)
            .max(4)
            .optional()
            .describe("1 Urgent, 2 High, 3 Normal, 4 Low, 0 none."),
        assignee_ids: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe("Replaces the assignee list. Ids come from get_project_context."),
        tag_ids: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe("Replaces the tag list. Ids come from get_project_context."),
        start_date: iso_day.optional(),
        target_date: iso_day.optional(),
    })
    .strict();

/**
 * Change one issue on the caller's board.
 *
 * Deliberately thin. The issue is resolved by number *within `ctx.projectId`*, so the model can
 * never reach across projects, and everything after that is `IssueService.update_issue` — which
 * already re-checks the role, verifies tag and assignee ownership, and enforces the board's legal
 * status moves. An illegal move comes back as its own prose ("The agent is working this issue…"),
 * which is exactly what the model should read out rather than an error.
 *
 * @example
 * await update_issue_tool.run({ issue_number: 142, status: "InReview", priority: 2 }, ctx);
 * // { number: 142, title: "Login fails on Safari", status: "InReview", priority: 2 }
 */
const update_issue_tool: DarwinTool<typeof input> = {
    name: "update_issue",
    description:
        "Change an existing issue in the current project — status, priority, title, body, " +
        "assignees, tags or dates. Only the fields you pass are changed. Some status moves are " +
        "not allowed while an agent is working the issue; if the move is refused, tell the user " +
        "what it said rather than trying again.",
    input,
    readOnly: false,
    action: Action.project.triage_issue,

    async run(args, ctx: DarwinContext) {
        const issue = await prisma.issue.findFirst({
            where: { projectId: ctx.projectId, number: args.issue_number },
            select: { id: true },
        });
        if (!issue) {
            throw new DarwinToolError(`There is no issue #${args.issue_number} in this project.`);
        }

        const patch: IssuePatch = {
            title: args.title,
            description: args.description ? to_issue_html(args.description) : undefined,
            status: args.status,
            custom_column_id: args.column_id,
            priority: args.priority,
            assignee_ids: args.assignee_ids,
            tag_ids: args.tag_ids,
            start_date: args.start_date ? new Date(`${args.start_date}T00:00:00.000Z`) : undefined,
            target_date: args.target_date
                ? new Date(`${args.target_date}T00:00:00.000Z`)
                : undefined,
        };

        const result = await IssueService.update_issue(
            { id: ctx.userId, name: ctx.userName },
            issue.id,
            patch,
        );

        if (!result.ok) {
            throw new DarwinToolError(
                result.message ??
                    (result.reason === "forbidden"
                        ? "You do not have permission to change issues in this project."
                        : `Issue #${args.issue_number} could not be updated.`),
            );
        }

        return {
            output: {
                number: result.issue.number,
                title: result.issue.title,
                status: result.issue.status,
                priority: result.issue.priority,
                assignees: result.issue.assignees.map((user) => user.name ?? user.email),
                tags: result.issue.tags.map((tag) => tag.name),
            },
            resource: () => ({
                kind: "issue",
                item: card_issue(result.issue),
                description: null,
                comments: [],
            }),
        };
    },
};

export default update_issue_tool;
