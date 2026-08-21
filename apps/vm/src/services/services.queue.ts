import { Queue, Worker, type Job } from "bullmq";
import queue_config from "../conf/config.queue";
import { ENV } from "../conf/config.env";
import E2B from "./services.e2b";
import Logger from "@trymatcha/logger";
import {
    QueueName,
    type DispatchJobData,
    type OnboardJobData,
    type ProductDiffJobData,
} from "@trymatcha/types";
import ProductDiffRunner from "./service.product_diff";

const log = Logger.scope("queue");
const PRODUCT_DIFF_LOCK_MS = 60_000;
const PRODUCT_DIFF_STALL_CHECK_MS = 30_000;

export default class QueueService {
    private onboard_consumer: Worker<OnboardJobData> | null = null;
    private dispatch_consumer: Worker<DispatchJobData> | null = null;
    private product_diff_consumer: Worker<ProductDiffJobData> | null = null;
    // VM owns this producer because Product Diff starts only after coding sandbox teardown.
    private product_diff_producer!: Queue<ProductDiffJobData>;

    constructor() {
        this.init_product_diff_producer();
        this.init_onboard_consumer();
        this.init_dispatch_consumer();
        this.init_product_diff_consumer();
    }

    private init_product_diff_producer() {
        this.product_diff_producer = new Queue(QueueName.ProductDiff, queue_config);
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
                const product_diff_ids = await E2B.run_worker_loop(job.data.workerId);
                for (const product_diff_id of product_diff_ids) {
                    await this.enqueue_product_diff(product_diff_id);
                }
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

    private init_product_diff_consumer() {
        this.product_diff_consumer = new Worker<ProductDiffJobData>(
            QueueName.ProductDiff,
            async (job: Job<ProductDiffJobData>) => ProductDiffRunner.run(job.data.productDiffId),
            {
                connection: queue_config.connection!,
                concurrency: ENV.SERVER_PRODUCT_DIFF_CONCURRENCY,
                lockDuration: PRODUCT_DIFF_LOCK_MS,
                stalledInterval: PRODUCT_DIFF_STALL_CHECK_MS,
                maxStalledCount: 0,
            },
        );

        this.product_diff_consumer.on("completed", (job) => {
            log.success("product diff job completed", { productDiff: job.data.productDiffId });
        });

        this.product_diff_consumer.on("failed", (job, err) => {
            log.error("product diff job failed", err, { productDiff: job?.data.productDiffId });
        });
    }

    private async enqueue_product_diff(product_diff_id: string) {
        await this.product_diff_producer.add(
            "generate",
            { productDiffId: product_diff_id },
            {
                jobId: product_diff_id,
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
        log.info("product diff enqueued", { productDiff: product_diff_id });
    }

    async close() {
        await this.onboard_consumer?.close();
        await this.dispatch_consumer?.close();
        await this.product_diff_consumer?.close();
        await this.product_diff_producer.close();
        this.onboard_consumer = null;
        this.dispatch_consumer = null;
        this.product_diff_consumer = null;
    }
}
