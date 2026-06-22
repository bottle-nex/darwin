import { Queue, Worker, type Job } from "bullmq";
import queue_config from "../config/config.queue";
import RouterProcessor from "../processors/processor.route";

interface RouteJobData {
    projectId: string;
}

export default class QueueService {
    private producer: Queue; // pushes from router to vm
    private consumer!: Worker<RouteJobData>; // consumer from server

    private SR_QUEUE: string = "issue.router"; // server-router queue
    private RM_QUEUE: string = "issue.vm"; // router-vm queue

    constructor() {
        this.producer = new Queue(this.RM_QUEUE, queue_config);
        this.init_consumer();
    }

    init_consumer() {
        this.consumer = new Worker<RouteJobData>(
            this.SR_QUEUE,
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
