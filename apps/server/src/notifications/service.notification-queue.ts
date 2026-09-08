import { type NotificationJobData, QueueName } from "@trydarwin/types";
import { type Job, Queue, Worker } from "bullmq";

import queue_config from "../configs/config.queue";
import AddedToProjectNotification from "./actions/action.added-to-project";
import AddedToTeamNotification from "./actions/action.added-to-team";
import ChatMentionNotification from "./actions/action.chat-mention";
import DescriptionMentionNotification from "./actions/action.description-mention";
import InviteAcceptedNotification from "./actions/action.invite-accepted";
import IssueAssignedNotification from "./actions/action.issue-assigned";
import IssueCommentedNotification from "./actions/action.issue-commented";
import IssueDeletedNotification from "./actions/action.issue-deleted";
import IssueMovedNotification from "./actions/action.issue-moved";
import IssuePriorityChangedNotification from "./actions/action.issue-priority-changed";
import IssueReferencedNotification from "./actions/action.issue-referenced";
import IssueStatusChangedNotification from "./actions/action.issue-status-changed";
import IssueUnassignedNotification from "./actions/action.issue-unassigned";
import MessageReactedNotification from "./actions/action.message-reacted";
import ProjectChatMentionNotification from "./actions/action.project-chat-mention";
import RemovedFromOrgNotification from "./actions/action.removed-from-org";
import RemovedFromTeamNotification from "./actions/action.removed-from-team";
import RoleChangedNotification from "./actions/action.role-changed";
import TeamChatMentionNotification from "./actions/action.team-chat-mention";

export default class NotificationQueueService {
    private queue: Queue<NotificationJobData>;
    private worker: Worker<NotificationJobData>;

    constructor() {
        this.queue = new Queue(QueueName.Notification, queue_config);
        this.worker = new Worker<NotificationJobData>(
            QueueName.Notification,
            async (job: Job<NotificationJobData>) => {
                await NotificationQueueService.dispatch(job.data);
            },
            {
                connection: queue_config.connection!,
                concurrency: 5,
            },
        );

        this.worker.on("completed", (job) => {
            console.log(`dispatched notification: ${job.data.action}`);
        });

        this.worker.on("failed", (job, err) => {
            console.error(`failed to dispatch notification ${job?.data.action}: ${err.message}`);
        });
    }

    private static async dispatch(data: NotificationJobData) {
        switch (data.action) {
            case "issue.assigned":
                return IssueAssignedNotification.handle(data);
            case "issue.unassigned":
                return IssueUnassignedNotification.handle(data);
            case "chat.mention":
                return ChatMentionNotification.handle(data);
            case "project_chat.mention":
                return ProjectChatMentionNotification.handle(data);
            case "team_chat.mention":
                return TeamChatMentionNotification.handle(data);
            case "issue.description_mention":
                return DescriptionMentionNotification.handle(data);
            case "issue.status_changed":
                return IssueStatusChangedNotification.handle(data);
            case "issue.priority_changed":
                return IssuePriorityChangedNotification.handle(data);
            case "issue.moved":
                return IssueMovedNotification.handle(data);
            case "issue.commented":
                return IssueCommentedNotification.handle(data);
            case "issue.referenced":
                return IssueReferencedNotification.handle(data);
            case "issue.deleted":
                return IssueDeletedNotification.handle(data);
            case "invite.accepted":
                return InviteAcceptedNotification.handle(data);
            case "member.added_to_project":
                return AddedToProjectNotification.handle(data);
            case "member.added_to_team":
                return AddedToTeamNotification.handle(data);
            case "member.removed_from_team":
                return RemovedFromTeamNotification.handle(data);
            case "member.removed_from_org":
                return RemovedFromOrgNotification.handle(data);
            case "member.role_changed":
                return RoleChangedNotification.handle(data);
            case "message.reacted":
                return MessageReactedNotification.handle(data);
        }
    }

    async enqueue(data: NotificationJobData) {
        try {
            await this.queue.add(data.action, data, {
                jobId: NotificationQueueService.job_id(data),
                removeOnComplete: true,
                removeOnFail: { count: 100, age: 3600 },
            });
        } catch (error) {
            console.error(`failed to enqueue notification ${data.action}:`, error);
        }
    }

    private static job_id(data: NotificationJobData): string {
        switch (data.action) {
            case "issue.assigned":
            case "issue.unassigned":
                return `${data.action}:${data.issueId}:${data.assigneeId}`;
            case "chat.mention":
                return `${data.action}:${data.chatId}:${data.memberId}`;
            case "project_chat.mention":
                return `${data.action}:${data.projectChatId}:${data.memberId}`;
            case "team_chat.mention":
                return `${data.action}:${data.teamChatId}:${data.memberId}`;
            case "issue.description_mention":
                return `${data.action}:${data.issueId}:${data.memberId}`;
            case "issue.status_changed":
                return `${data.action}:${data.issueId}:${data.recipientId}~${data.toStatus}`;
            case "issue.priority_changed":
                return `${data.action}:${data.issueId}:${data.recipientId}~${data.priority}`;
            case "issue.moved":
                return `${data.action}:${data.issueId}:${data.recipientId}~${data.toColumnId ?? "board"}`;
            case "issue.commented":
                return `${data.action}:${data.chatId}:${data.recipientId}`;
            case "issue.referenced":
                return `${data.action}:${data.chatId ?? data.projectChatId ?? data.teamChatId}:${data.issueId}:${data.recipientId}`;
            case "issue.deleted":
                return `${data.action}:${data.issueId}:${data.recipientId}`;
            case "invite.accepted":
                return `${data.action}:${data.invitationId}:${data.recipientId}`;
            case "member.added_to_project":
                return `${data.action}:${data.projectId}:${data.recipientId}`;
            case "member.added_to_team":
            case "member.removed_from_team":
                return `${data.action}:${data.teamId}:${data.recipientId}`;
            case "member.removed_from_org":
                return `${data.action}:${data.orgId}:${data.recipientId}`;
            case "member.role_changed":
                return `${data.action}:${data.teamId}:${data.recipientId}~${data.role}`;
            case "message.reacted":
                return `${data.action}:${data.reactionId}`;
        }
    }

    async shutdown() {
        await this.worker.close();
        await this.queue.close();
    }
}
