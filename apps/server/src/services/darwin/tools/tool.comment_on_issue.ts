import { Action } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import z from "zod";

import IssueCommentService, { type CommentFailureReason } from "../../service.issue-comment";
import { to_issue_html } from "./tool.body";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";

const REFUSALS: Record<CommentFailureReason, string> = {
    issue_not_found: "That issue is not in this project.",
    forbidden: "You do not have permission to comment in this project.",
    reply_not_found: "That comment is not on this issue.",
    empty_message: "The comment came out empty. Write the text out in full.",
};

const input = z
    .object({
        issue_number: z
            .number()
            .int()
            .min(1)
            .describe("The issue's number as shown on the board, e.g. 142 for #142."),
        message: z
            .string()
            .min(1)
            .max(5000)
            .describe(
                "What to post, in plain prose, written as the user. Say only what they asked " +
                    "you to say — do not add your own commentary or sign it.",
            ),
    })
    .strict();

/**
 * Post a comment on an issue, as the person asking.
 *
 * Goes through `IssueCommentService`, the same path the socket handler uses, so the comment
 * appears live on everyone's board and the mention, reference and follower notifications all
 * fire. The comment is attributed to the user, not to Darwin — there is no bot account.
 *
 * @example
 * await comment_on_issue_tool.run({ issue_number: 142, message: "Fixed on staging." }, ctx);
 * // { issueNumber: 142, commentId: "cl…", postedAs: "Rishi Kant" }
 */
const comment_on_issue_tool: DarwinTool<typeof input> = {
    name: "comment_on_issue",
    description:
        "Post a comment on an issue in the current project. It is posted as the user, so write " +
        "in their voice. Use this when they ask you to reply, note something, or follow up on an " +
        "issue. Do not use it to record your own observations.",
    input,
    readOnly: false,
    action: Action.project.read,

    async run(args, ctx: DarwinContext) {
        const issue = await prisma.issue.findFirst({
            where: { projectId: ctx.projectId, number: args.issue_number },
            select: { id: true },
        });
        if (!issue) {
            throw new DarwinToolError(`There is no issue #${args.issue_number} in this project.`);
        }

        const result = await IssueCommentService.create({
            issueId: issue.id,
            projectId: ctx.projectId,
            actorId: ctx.userId,
            message: to_issue_html(args.message),
        });

        if (!result.ok) throw new DarwinToolError(REFUSALS[result.reason]);

        return {
            output: {
                issueNumber: args.issue_number,
                commentId: result.comment.id,
                postedAs: ctx.userName,
            },
            resource: () => ({
                kind: "comment",
                issueNumber: args.issue_number,
                text: args.message,
                by: ctx.userName,
            }),
        };
    },
};

export default comment_on_issue_tool;
