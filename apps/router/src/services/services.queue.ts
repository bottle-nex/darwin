import Logger from "@trydarwin/logger";
import { Queue, Worker, type Job } from "bullmq";
import queue_config from "../config/config.queue";
import RouterProcessor from "../processors/processor.route";
import { QueueName, type DispatchJobData, type RouteJobData } from "@trydarwin/types";

const log = Logger.scope("queue");

export default class QueueService {
    private producer: Queue<DispatchJobData>;
    private consumer!: Worker<RouteJobData>;

    constructor() {
        this.producer = new Queue(QueueName.IssueVm, queue_config);
        this.init_consumer();
    }

    init_consumer() {
        this.consumer = new Worker<RouteJobData>(
            QueueName.IssueRouter,
            async (job: Job<RouteJobData>) => {
                log.step("route job received", { project: job.data.projectId });
                await RouterProcessor.process_route_job(job.data.projectId, this);
            },
            {
                connection: queue_config.connection!,
                concurrency: 1,
            },
        );

        this.consumer.on("completed", (job) => {
            log.success("route job completed", { project: job.data.projectId });
        });

        this.consumer.on("failed", (job, err) => {
            log.error("route job failed", err, { project: job?.data.projectId });
        });
    }

    async enqueue_dispatch(worker_id: string) {
        await this.producer.add(
            "dispatch",
            { workerId: worker_id },
            { jobId: `dispatch-${worker_id}`, removeOnComplete: true, removeOnFail: true },
        );
        log.info("dispatch enqueued", { worker: worker_id });
    }

    async shutdown() {
        await this.consumer.close();
        await this.producer.close();
    }
}
