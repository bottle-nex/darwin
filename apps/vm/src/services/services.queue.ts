import { Job, Worker } from "bullmq";
import queue_config from "../conf/config.queue";

interface RouteJobData {
    projectId: string;
}

export default class QueueService {
    private SR_QUEUE: string = "project.onboard"; // server-vm queue
    private consumer: Worker | null = null;

    constructor() {
        this.init_consumer();
    }

    private async init_consumer() {
        this.consumer = new Worker<RouteJobData>(
            this.SR_QUEUE,
            async (job: Job<RouteJobData>) => {
                await this.eat_job(job.data.projectId, this);
            },
            {
                connection: queue_config.connection!,
                concurrency: 1,
            },
        );
    }

    private async eat_job(projectId: string, context: any) {}

    async close() {
        await this.consumer?.close();
        this.consumer = null;
    }
}
