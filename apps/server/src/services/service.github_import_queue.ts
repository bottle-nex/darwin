import { type GithubImportJobData, QueueName } from "@trymatcha/types";
import { type Job, Worker } from "bullmq";

import queue_config from "../configs/config.queue";
import GithubImportService from "./service.github_import";

/** Kept below the sibling queues' 5 because every job spends its time on GitHub's rate-limited API. */
const GITHUB_IMPORT_CONCURRENCY = 2;

export default class GithubImportQueueService {
    private worker: Worker<GithubImportJobData>;

    constructor() {
        this.worker = new Worker<GithubImportJobData>(
            QueueName.GithubImport,
            async (job: Job<GithubImportJobData>) => {
                await GithubImportQueueService.dispatch(job.data);
            },
            { connection: queue_config.connection!, concurrency: GITHUB_IMPORT_CONCURRENCY },
        );

        this.worker.on("failed", (job, err) => {
            console.error(`[github-import] ${job?.data.kind} job failed: ${err.message}`);
        });
    }

    static async dispatch(data: GithubImportJobData) {
        if (data.kind === "issue_opened") {
            await GithubImportService.import_issue(data.repoId, data.payload);
            return;
        }
        await GithubImportService.backfill(data.projectId, data.page);
    }

    async close() {
        await this.worker.close();
    }
}
