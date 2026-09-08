import { Action, Permissions } from "@trydarwin/access-control";
import { type Prisma, prisma } from "@trydarwin/database";
import { OutboundSocketMessageType } from "@trydarwin/types";

import { server_services } from "..";
import Access from "../access-control/access";
import { issue_recipients } from "../notifications/recipients";
import MessageReferenceService, { MESSAGE_REFERENCE_INCLUDE } from "./service.message-references";

const COMMENT_INCLUDE = {
    sender: true,
    repliedTo: { include: { sender: true } },
    references: { include: MESSAGE_REFERENCE_INCLUDE },
} satisfies Prisma.ChatInclude;

export type IssueComment = Prisma.ChatGetPayload<{ include: typeof COMMENT_INCLUDE }>;

export type CommentFailureReason =
    "issue_not_found" | "forbidden" | "reply_not_found" | "empty_message";

export type CreateCommentResult =
    { ok: true; comment: IssueComment } | { ok: false; reason: CommentFailureReason };

/**
 * Posting a comment on an issue.
 *
 * Lifted out of the socket handler so Ask Darwin can post the same way a person does. The
 * notification fan-out below is the reason this had to move rather than be repeated: a comment
 * has to reach people who were @mentioned, people watching an issue it references, and the
 * issue's own assignees and creator, each excluded from the ones before. Two copies of that would
 * drift within a week.
 *
 * @example
 * const result = await IssueCommentService.create({
 *     issueId, projectId, actorId, message: "Fixed in #143.",
 * });
 * if (result.ok) console.log(result.comment.id);
 */
export default class IssueCommentService {
    static async create(input: {
        issueId: string;
        projectId: string;
        actorId: string;
        message: string;
        repliedToId?: string;
        /** Echoed back on the socket so the sender's own optimistic message reconciles. */
        operationId?: string;
    }): Promise<CreateCommentResult> {
        const issue = await prisma.issue.findUnique({
            where: { id: input.issueId },
            select: {
                id: true,
                projectId: true,
                createdById: true,
                assignees: { select: { id: true } },
            },
        });
        if (!issue || issue.projectId !== input.projectId) {
            return { ok: false, reason: "issue_not_found" };
        }

        const role = await Access.project(input.actorId, issue.projectId);
        if (!role || !Permissions.project(role, Action.project.read)) {
            return { ok: false, reason: "forbidden" };
        }

        // Replying to a reply attaches to the thread's root, so threads stay one level deep.
        let thread_root_id: string | undefined;
        if (input.repliedToId) {
            const replied_to = await prisma.chat.findUnique({
                where: { id: input.repliedToId },
                select: { issueId: true, repliedToId: true },
            });
            if (!replied_to || replied_to.issueId !== issue.id) {
                return { ok: false, reason: "reply_not_found" };
            }
            thread_root_id = replied_to.repliedToId ?? input.repliedToId;
        }

        const resolved = await MessageReferenceService.resolve(input.message, issue.projectId);
        if (!resolved.message) return { ok: false, reason: "empty_message" };

        const comment = await prisma.chat.create({
            data: {
                issueId: issue.id,
                senderId: input.actorId,
                message: resolved.message,
                repliedToId: thread_root_id,
                references: { create: MessageReferenceService.to_rows(resolved) },
            },
            include: COMMENT_INCLUDE,
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(issue.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.CHAT_CREATED,
                projectId: issue.projectId,
                payload: { ...comment, reactions: [] },
                operationId: input.operationId ?? comment.id,
            }),
        );

        const mentioned = await MessageReferenceService.mention_targets({
            memberIds: resolved.memberIds,
            teamIds: resolved.teamIds,
            projectId: issue.projectId,
            actorId: input.actorId,
        });

        await Promise.all(
            mentioned.memberIds.map((memberId) =>
                server_services.notifications.enqueue({
                    action: "chat.mention",
                    chatId: comment.id,
                    memberId,
                    mentionedById: input.actorId,
                }),
            ),
        );

        const referenced = await MessageReferenceService.referenced_issue_recipients({
            issueIds: resolved.issueIds.filter((id) => id !== issue.id),
            exclude: [input.actorId, ...mentioned.userIds],
        });

        await Promise.all(
            referenced.map((target) =>
                server_services.notifications.enqueue({
                    action: "issue.referenced",
                    issueId: target.issueId,
                    chatId: comment.id,
                    recipientId: target.recipientId,
                    actorId: input.actorId,
                }),
            ),
        );

        await Promise.all(
            issue_recipients({
                assigneeIds: issue.assignees.map((assignee) => assignee.id),
                creatorId: issue.createdById,
                exclude: [
                    input.actorId,
                    ...mentioned.userIds,
                    ...referenced.map((target) => target.recipientId),
                ],
            }).map((recipientId) =>
                server_services.notifications.enqueue({
                    action: "issue.commented",
                    chatId: comment.id,
                    recipientId,
                    senderId: input.actorId,
                }),
            ),
        );

        return { ok: true, comment };
    }
}
