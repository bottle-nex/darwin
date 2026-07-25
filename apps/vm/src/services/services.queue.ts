import { Job, Worker } from "bullmq";
import queue_config from "../conf/config.queue";
import E2B from "./services.e2b";

export interface OnboardJobData {
    session_id: string;
    project_id: string;
    repo_url: string;
    branch: string;
    installation_id: number;
}

export default class QueueService {
    private ONBOARD_QUEUE: string = "project.onboard"; // server-vm queue
    private consumer: Worker | null = null;

    constructor() {
        this.init_consumer();
    }

    private async init_consumer() {
        this.consumer = new Worker<OnboardJobData>(
            this.ONBOARD_QUEUE,
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
