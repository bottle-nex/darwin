import Logger from "@trymatcha/logger";
import { Queue } from "bullmq";
import queue_config from "../config/config.queue";
import { QueueName, type RouteJobData, type DispatchJobData } from "@trymatcha/types";

const log = Logger.scope("queue");

export default class QueueService {
    private queue: Queue<RouteJobData>;
    private dispatch_queue: Queue<DispatchJobData>;

    constructor() {
        this.queue = new Queue(QueueName.IssueRouter, queue_config);
        this.dispatch_queue = new Queue(QueueName.IssueVm, queue_config);
    }

    async enqueue_project(project_id: string) {
        await this.queue.add(
            "route",
            { projectId: project_id },
            {
                jobId: `route-${project_id}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
        log.info("queued project for routing", { project: project_id });
    }

    async has_active_dispatch(worker_id: string): Promise<boolean> {
        const job = await this.dispatch_queue.getJob(`dispatch-${worker_id}`);
        if (!job) return false;
        const state = await job.getState();
        return state === "waiting" || state === "active" || state === "delayed";
    }

    async enqueue_dispatch(worker_id: string) {
        await this.dispatch_queue.add(
            "dispatch",
            { workerId: worker_id },
            { jobId: `dispatch-${worker_id}`, removeOnComplete: true, removeOnFail: true },
        );
        log.info("queued dispatch for worker", { worker: worker_id });
    }
}
