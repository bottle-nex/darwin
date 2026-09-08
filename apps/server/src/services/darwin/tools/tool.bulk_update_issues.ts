import { Action } from "@trydarwin/access-control";
import { IssueStatus, prisma } from "@trydarwin/database";
import z from "zod";

import { BOARD_ISSUE_SELECT } from "../../service.board-issues";
import IssueService, { type IssuePatch } from "../../service.issue";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";
import { card_issue } from "./tool.trim";

const MAX_ISSUES = 25;

const input = z
    .object({
        issue_numbers: z
            .array(z.number().int().min(1))
            .min(1)
            .max(MAX_ISSUES)
            .describe(
                `The issue numbers to change, at most ${MAX_ISSUES}. List them explicitly — read ` +
                    "the board first and name the issues rather than guessing a range.",
            ),
        status: z.enum(IssueStatus).optional(),
        column_id: z.string().min(1).optional().describe("Move them all into this board column."),
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
            .describe("Replaces the assignees on every issue listed."),
        tag_ids: z
            .array(z.string().min(1))
            .max(20)
            .optional()
            .describe("Replaces the tags on every issue listed."),
    })
    .strict();

/**
 * Apply the same change to several issues.
 *
 * Runs one `IssueService.update_issue` per issue, in sequence, exactly as the bulk HTTP endpoint
 * does — so each issue gets its own permission check, its own legal-move check, and its own
 * activity row and broadcast. A single failure does not stop the rest.
 *
 * The result separates what changed from what was refused, so the model reports the refusals to
 * the user instead of claiming it moved everything.
 *
 * @example
 * await bulk_update_issues_tool.run({ issue_numbers: [12, 15], priority: 1 }, ctx);
 * // { updated: [12], refused: [{ number: 15, reason: "The agent is working this issue…" }] }
 */
const bulk_update_issues_tool: DarwinTool<typeof input> = {
    name: "bulk_update_issues",
    description:
        "Apply one change to several issues at once — status, column, priority, assignees or " +
        "tags. Read the board first so you are naming real issues. Tell the user exactly which " +
        "issues you changed, and repeat any that were refused.",
    input,
    readOnly: false,
    action: Action.project.triage_issue,

    async run(args, ctx: DarwinContext) {
        const patch: IssuePatch = {
            status: args.status,
            custom_column_id: args.column_id,
            priority: args.priority,
            assignee_ids: args.assignee_ids,
            tag_ids: args.tag_ids,
        };
        if (Object.values(patch).every((value) => value === undefined)) {
            throw new DarwinToolError(
                "Say what to change — status, column, priority, assignees or tags.",
            );
        }

        const issues = await prisma.issue.findMany({
            where: { projectId: ctx.projectId, number: { in: args.issue_numbers } },
            select: { id: true, number: true },
        });
        const by_number = new Map(issues.map((issue) => [issue.number, issue.id]));

        const updated: number[] = [];
        const refused: { number: number; reason: string }[] = [];

        // Sequential: two concurrent writes to the same issue would race, and the model has
        // already been told these are one change applied to a list.
        for (const number of args.issue_numbers) {
            const id = by_number.get(number);
            if (!id) {
                refused.push({ number, reason: "Not an issue in this project." });
                continue;
            }

            const result = await IssueService.update_issue(
                { id: ctx.userId, name: ctx.userName },
                id,
                patch,
            );
            if (result.ok) {
                updated.push(number);
            } else {
                refused.push({
                    number,
                    reason:
                        result.message ??
                        (result.reason === "forbidden"
                            ? "You do not have permission to change it."
                            : "It could not be updated."),
                });
            }
        }

        const rows = updated.length
            ? await prisma.issue.findMany({
                  where: { projectId: ctx.projectId, number: { in: updated } },
                  select: BOARD_ISSUE_SELECT,
              })
            : [];

        return {
            output: { updated, refused },
            ...(rows.length || refused.length
                ? {
                      resource: () => ({
                          kind: "bulk" as const,
                          updated: rows.map(card_issue),
                          refused,
                      }),
                  }
                : {}),
        };
    },
};

export default bulk_update_issues_tool;
