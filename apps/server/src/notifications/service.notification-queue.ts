import { Queue, Worker, type Job } from "bullmq";
import { QueueName, type NotificationJobData } from "@trymatcha/types";
import queue_config from "../configs/config.queue";
import IssueAssignedNotification from "./actions/action.issue-assigned";
import IssueUnassignedNotification from "./actions/action.issue-unassigned";
import ChatMentionNotification from "./actions/action.chat-mention";
import ProjectChatMentionNotification from "./actions/action.project-chat-mention";

/**
 * Producer + consumer for the notification dispatch queue.
 *
 * The consumer runs in-process for now, but the only thing anything else in the app ever
 * touches is {@link enqueue} — the queue itself is the seam. If this ever needs to become
 * its own deployable (mirroring how `apps/router` consumes `QueueName.IssueRouter`), the
 * `actions/` classes and the worker registration below are what move; no producer call site
 * changes.
 */
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

    /** One class per action — this just routes the job to the right one. */
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
        }
    }

    /**
     * Enqueue a notification job. `jobId` is deterministic per action + target so retries
     * (BullMQ's default 3 attempts, see `configs/config.queue.ts`) and rapid duplicate
     * triggers (e.g. re-assigning the same user twice) dedupe instead of double-firing.
     */
    async enqueue(data: NotificationJobData) {
        await this.queue.add(data.action, data, {
            jobId: NotificationQueueService.job_id(data),
            removeOnComplete: true,
            removeOnFail: 100,
        });
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
        }
    }

    async shutdown() {
        await this.worker.close();
        await this.queue.close();
    }
}
