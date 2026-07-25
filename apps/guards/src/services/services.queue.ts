import { Queue } from "bullmq";
import queue_config from "../config/config.queue";
import { QueueName, type RouteJobData } from "@trymatcha/types";

export default class QueueService {
    private queue: Queue<RouteJobData>;

    constructor() {
        this.queue = new Queue(QueueName.IssueRouter, queue_config);
    }

    async enqueue_project(project_id: string) {
        await this.queue.add(
            "route",
            { projectId: project_id },
            {
                jobId: `route-${project_id}`,
                removeOnComplete: true,
                removeOnFail: 100,
            },
        );
    }
}
