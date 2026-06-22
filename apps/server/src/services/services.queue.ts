import { Queue } from "bullmq";
import queue_config from "../configs/config.queue";

export default class QueueService {
    private SR_QUEUE: string = "issue.route"; // server-router-queue
    private queue: Queue;

    constructor() {
        this.queue = new Queue(this.SR_QUEUE, queue_config);
    }

    async enqueue_project(project_id: string) {
        await this.queue.add(
            "route",
            { project_id },
            {
                jobId: `route:${project_id}`,
                removeOnComplete: true,
                removeOnFail: 100,
            },
        );
    }
}
