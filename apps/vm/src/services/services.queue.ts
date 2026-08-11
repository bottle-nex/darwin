import { Job, Worker } from "bullmq";
import queue_config from "../conf/config.queue";
import { ENV } from "../conf/config.env";
import E2B from "./services.e2b";
import Logger from "@trymatcha/logger";
import { QueueName, type DispatchJobData, type OnboardJobData } from "@trymatcha/types";

const log = Logger.scope("queue");

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
                log.step("onboarding job received", {
                    session: session_id,
                    project: project_id,
                });
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

        this.onboard_consumer.on("completed", (job) => {
            log.success("onboarding job completed", { session: job.data.session_id });
        });

        this.onboard_consumer.on("failed", (job, err) => {
            log.error("onboarding job failed", err, { session: job?.data.session_id });
        });
    }

    private init_dispatch_consumer() {
        this.dispatch_consumer = new Worker<DispatchJobData>(
            QueueName.IssueVm,
            async (job: Job<DispatchJobData>) => {
                log.step("dispatch job received", { worker: job.data.workerId });
                await E2B.run_worker_loop(job.data.workerId);
            },
            {
                connection: queue_config.connection!,
                // each job now drives a whole sandbox run (possibly many issues), not a
                // quick db update — concurrency:1 would serialize every worker in the
                // fleet through a single job at a time.
                concurrency: ENV.SERVER_VM_DISPATCH_CONCURRENCY,
            },
        );

        this.dispatch_consumer.on("completed", (job) => {
            log.success("dispatch job completed", { worker: job.data.workerId });
        });

        this.dispatch_consumer.on("failed", (job, err) => {
            log.error("dispatch job failed", err, { worker: job?.data.workerId });
        });
    }

    async close() {
        await this.onboard_consumer?.close();
        await this.dispatch_consumer?.close();
        this.onboard_consumer = null;
        this.dispatch_consumer = null;
    }
}
