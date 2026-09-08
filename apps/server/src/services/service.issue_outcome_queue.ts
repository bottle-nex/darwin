import { type IssueOutcomeJobData, QueueName } from "@trydarwin/types";
import { type Job, Worker } from "bullmq";

import queue_config from "../configs/config.queue";
import IssueOutcomeService, { IssueOutcomeConflict } from "./service.issue_outcome";

export default class IssueOutcomeQueueService {
    private worker: Worker<IssueOutcomeJobData>;

    constructor() {
        this.worker = new Worker<IssueOutcomeJobData>(
            QueueName.IssueOutcome,
            async (job: Job<IssueOutcomeJobData>) => {
                await IssueOutcomeQueueService.dispatch(job.data);
            },
            { connection: queue_config.connection!, concurrency: 5 },
        );

        this.worker.on("failed", (job, err) => {
            console.error(
                `[issue-outcome] job for issue ${job?.data.issueId} failed: ${err.message}`,
            );
        });
    }

    static async dispatch(data: IssueOutcomeJobData) {
        try {
            if (data.kind === "pr_opened") {
                await IssueOutcomeService.pr_opened(data);
                return;
            }
            if (data.kind === "reconcile") {
                await IssueOutcomeService.reconcile(data.issueId);
                return;
            }
            if (data.kind === "pr_merged") {
                await IssueOutcomeService.pr_merged(data);
                return;
            }
            await IssueOutcomeService.failed(data);
        } catch (error) {
            if (error instanceof IssueOutcomeConflict) {
                console.warn(`[issue-outcome] issue ${data.issueId} rejected: ${error.message}`);
                return;
            }
            throw error;
        }
    }

    async close() {
        await this.worker.close();
    }
}
