import { Queue, Worker, type Job } from "bullmq";
import queue_config from "../config/config.queue";
import RouterProcessor from "../processors/processor.route";
import { QueueName, type DispatchJobData, type RouteJobData } from "@trymatcha/types";

export default class QueueService {
    private producer: Queue<DispatchJobData>; // pushes from router to vm
    private consumer!: Worker<RouteJobData>; // consumer from server

    constructor() {
        this.producer = new Queue(QueueName.IssueVm, queue_config);
        this.init_consumer();
    }

    init_consumer() {
        this.consumer = new Worker<RouteJobData>(
            QueueName.IssueRouter,
            async (job: Job<RouteJobData>) => {
                await RouterProcessor.process_route_job(job.data.projectId, this);
            },
            {
                connection: queue_config.connection!,
                concurrency: 1,
            },
        );

        this.consumer.on("completed", (job) => {
            console.log(`routed project ${job.data.projectId}`);
        });

        this.consumer.on("failed", (job, err) => {
            console.error(`failed to route project ${job?.data.projectId}: ${err.message}`);
        });
    }

    async enqueue_dispatch(worker_id: string) {
        await this.producer.add(
            "dispatch",
            { workerId: worker_id },
            { jobId: `dispatch:${worker_id}`, removeOnComplete: true },
        );
    }

    async shutdown() {
        await this.consumer.close();
        await this.producer.close();
    }
}
