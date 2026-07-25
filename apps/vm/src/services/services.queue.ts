import { Job, Worker } from "bullmq";
import queue_config from "../conf/config.queue";
import E2B from "./services.e2b";
import { QueueName, type OnboardJobData } from "@trymatcha/types";

export default class QueueService {
    private consumer: Worker | null = null;

    constructor() {
        this.init_consumer();
    }

    private async init_consumer() {
        this.consumer = new Worker<OnboardJobData>(
            QueueName.ProjectOnboard,
            async (job: Job<OnboardJobData>) => {
                const { session_id, project_id, repo_url, branch, installation_id } = job.data;
                await E2B.run_onboarding_job(
                    session_id,
                    project_id,
                    repo_url,
                    branch,
                    installation_id,
                );
            },
            {
                connection: queue_config.connection!,
                concurrency: 1,
            },
        );
    }

    async close() {
        await this.consumer?.close();
        this.consumer = null;
    }
}
