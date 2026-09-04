import { prisma } from "@trydarwin/database";
import Logger from "@trydarwin/logger";
import {
    type DispatchJobData,
    type OnboardJobData,
    type ProductDiffJobData,
    QueueName,
} from "@trydarwin/types";
import { type Job, Worker } from "bullmq";

import { ENV } from "../../conf/config.env";
import queue_config from "../../conf/config.queue";
import ProductDiffRunner from "../capsule/service.product_diff";
import E2B from "../sandbox/service.e2b";

const log = Logger.scope("queue");
// A dispatch job owns a sandbox for the whole run, and in manual mode that run can sit paused
// for as long as a person takes to answer. BullMQ's defaults assume a job is seconds long: the
// lock lapses, the job is treated as stalled, and it is handed to another consumer — which then
// runs the same issue a second time against the same sandbox. Never redeliver these.
// Long enough that a busy event loop cannot miss a renewal — BullMQ renews at half this — and
// short enough that a killed vm's job is reclaimed in a couple of minutes rather than stranding
// its worker. A paused run does not need the lock to outlast the pause: the process holding it
// is the vm, which stays alive and keeps renewing while the sandbox sleeps.
const DISPATCH_LOCK_MS = 2 * 60_000;
const DISPATCH_STALL_CHECK_MS = 30_000;
const PRODUCT_DIFF_LOCK_MS = 60_000;
const PRODUCT_DIFF_STALL_CHECK_MS = 30_000;

export async function run_product_diff_job(job: Job<ProductDiffJobData>): Promise<void> {
    await ProductDiffRunner.run(job.data.productDiffId);
}

export default class QueueService {
    private onboard_consumer: Worker<OnboardJobData> | null = null;
    private dispatch_consumer: Worker<DispatchJobData> | null = null;
    private product_diff_consumer: Worker<ProductDiffJobData> | null = null;
    constructor() {
        this.init_onboard_consumer();
        this.init_dispatch_consumer();
        this.init_product_diff_consumer();
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
                concurrency: ENV.VM_DISPATCH_CONCURRENCY,
                lockDuration: DISPATCH_LOCK_MS,
                stalledInterval: DISPATCH_STALL_CHECK_MS,
                maxStalledCount: 0,
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
            run_product_diff_job,
            {
                connection: queue_config.connection!,
                concurrency: ENV.VM_PRODUCT_DIFF_CONCURRENCY,
                lockDuration: PRODUCT_DIFF_LOCK_MS,
                stalledInterval: PRODUCT_DIFF_STALL_CHECK_MS,
                maxStalledCount: 0,
            },
        );

        this.product_diff_consumer.on("completed", async (job) => {
            const productDiff = await prisma.productDiff.findUnique({
                where: { id: job.data.productDiffId },
                select: { status: true, error: true },
            });
            if (productDiff?.status !== "Ready") {
                log.error(
                    "product diff job settled without a ready artifact",
                    new Error(productDiff?.error ?? "Product Diff did not produce an artifact"),
                    {
                        productDiff: job.data.productDiffId,
                        status: productDiff?.status ?? "Missing",
                    },
                );
                return;
            }
            log.success("product diff job settled", {
                productDiff: job.data.productDiffId,
                status: productDiff?.status ?? "Missing",
            });
        });

        this.product_diff_consumer.on("failed", (job, err) => {
            log.error("product diff job failed", err, { productDiff: job?.data.productDiffId });
        });
    }

    async close() {
        await this.onboard_consumer?.close();
        await this.dispatch_consumer?.close();
        await this.product_diff_consumer?.close();
        this.onboard_consumer = null;
        this.dispatch_consumer = null;
        this.product_diff_consumer = null;
    }
}
