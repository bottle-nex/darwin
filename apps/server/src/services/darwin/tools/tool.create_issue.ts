import { Action } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import z from "zod";

import Access from "../../../access-control/access";
import BoardIssueService from "../../service.board-issues";
import IssueService from "../../service.issue";
import { to_issue_html } from "./tool.body";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";
import { card_issue } from "./tool.trim";

const iso_day = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .describe("A calendar day as YYYY-MM-DD.");

const input = z
    .object({
        title: z.string().min(1).max(80).describe("One line, under 80 characters."),
        description: z
            .string()
            .max(20000)
            .optional()
            .describe(
                "The issue body in plain prose. Include reproduction steps and expected " +
                    "behaviour only when the user gave them. Do not invent detail they did not " +
                    "say, and do not ask them for a body — omit this and the title is used.",
            ),
        column_id: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Drop the issue into a board column from get_project_context. Omit this and the " +
                    "issue goes to Todo, where the coding agent picks it up — so pass a column " +
                    "whenever the user names a space or board, or says it is not for the agent.",
            ),
        assignee_ids: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe(
                "User ids from get_project_context. Omit this and it is assigned to the person " +
                    "you are talking to. Do not ask who to assign it to.",
            ),
        priority: z
            .number()
            .int()
            .min(0)
            .max(4)
            .optional()
            .describe("1 Urgent, 2 High, 3 Normal (default), 4 Low, 0 none."),
        tag_ids: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe("Tag ids from get_project_context."),
        start_date: iso_day.optional(),
        target_date: iso_day.optional(),
    })
    .strict();

function as_date(day: string | undefined): Date | undefined {
    return day ? new Date(`${day}T00:00:00.000Z`) : undefined;
}

/**
 * File a new issue on the caller's board.
 *
 * Repeats the assignee-membership and tag-ownership checks from `controller.create_issues.ts`
 * on purpose: the model must not be able to reach a state the HTTP API would refuse. The write
 * itself goes through `IssueService.create_issue`, so activity, notifications and the live board
 * broadcast all fire exactly as they do for a human — writing to Prisma directly would silently
 * skip all three.
 *
 * @example
 * await create_issue_tool.run(
 *     { title: "Checkout test flakes", description: "…", assignee_ids: ["cku…"] },
 *     ctx,
 * );
 * // { id: "cl…", number: 84, title: "Checkout test flakes", status: "Todo" }
 */
const create_issue_tool: DarwinTool<typeof input> = {
    name: "create_issue",
    description:
        "Create an issue in the current project. When the user asks for one, file it — only the " +
        "title is required, so never ask them for a body or an assignee. Ask a question back " +
        "only if you do not know what the issue is about. Call get_project_context first when " +
        "you need a column, assignee or tag id.",
    input,
    readOnly: false,
    action: Action.project.create_issue,

    async run(args, ctx: DarwinContext) {
        if (args.start_date && args.target_date && args.start_date > args.target_date) {
            throw new DarwinToolError("The start date has to be on or before the end date.");
        }

        if (args.column_id) {
            const column = await BoardIssueService.find_project_column(
                ctx.projectId,
                args.column_id,
            );
            if (!column) {
                throw new DarwinToolError(
                    "That column is not on this project's board. Re-read the project and use " +
                        "one of its columns.",
                );
            }
        }

        // Default to the person asking rather than asking them who to assign it to.
        const assignee_ids = args.assignee_ids?.length ? args.assignee_ids : [ctx.userId];
        const assignee_roles = await Promise.all(
            assignee_ids.map((id) => Access.project(id, ctx.projectId)),
        );
        if (assignee_roles.some((role) => !role)) {
            throw new DarwinToolError(
                "Someone you tried to assign is not a member of this project. Re-read the " +
                    "project and use one of its members.",
            );
        }

        if (args.tag_ids?.length) {
            const owned = await prisma.tag.count({
                where: { id: { in: args.tag_ids }, projectId: ctx.projectId },
            });
            if (owned !== args.tag_ids.length) {
                throw new DarwinToolError("One or more tag ids are not in this project.");
            }
        }

        const issue = await IssueService.create_issue({
            project_id: ctx.projectId,
            title: args.title,
            description: to_issue_html(args.description?.trim() || args.title),
            priority: args.priority,
            custom_column_id: args.column_id,
            start_date: as_date(args.start_date),
            target_date: as_date(args.target_date),
            assignee_ids,
            tag_ids: args.tag_ids,
            created_by: { id: ctx.userId, name: ctx.userName },
        });

        if (!issue) throw new DarwinToolError("The issue could not be created. Try again.");

        return {
            output: {
                id: issue.id,
                number: issue.number,
                title: issue.title,
                status: issue.status,
                assignees: issue.assignees.map((user) => user.name ?? user.email),
            },
            resource: () => ({
                kind: "issue",
                item: card_issue(issue),
                description: null,
                comments: [],
            }),
        };
    },
};

export default create_issue_tool;
