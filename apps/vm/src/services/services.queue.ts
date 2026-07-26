import { Job, Worker } from "bullmq";
import queue_config from "../conf/config.queue";
import E2B from "./services.e2b";
import IssueSolver from "./service.issue_solver";
import { QueueName, type DispatchJobData, type OnboardJobData } from "@trymatcha/types";

export default class QueueService {
    private onboard_consumer: Worker<OnboardJobData> | null = null;
    private dispatch_consumer: Worker<DispatchJobData> | null = null;

    constructor() {
        this.init_onboard_consumer();
        this.init_dispatch_consumer();
    }

    private init_onboard_consumer() {
        this.onboard_consumer = new Worker<OnboardJobData>(
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

    private init_dispatch_consumer() {
        this.dispatch_consumer = new Worker<DispatchJobData>(
            QueueName.IssueVm,
            async (job: Job<DispatchJobData>) => {
                await IssueSolver.solve_issue_for_worker_id(job.data.workerId);
            },
            {
                connection: queue_config.connection!,
                concurrency: 1,
            },
        );

        this.dispatch_consumer.on("completed", (job) => {
            console.log(`dispatched worker ${job.data.workerId}`);
        });

        this.dispatch_consumer.on("failed", (job, err) => {
            console.error(`failed to dispatch worker ${job?.data.workerId}: ${err.message}`);
        });
    }

    async close() {
        await this.onboard_consumer?.close();
        await this.dispatch_consumer?.close();
        this.onboard_consumer = null;
        this.dispatch_consumer = null;
    }
}
