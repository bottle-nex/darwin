import { Queue } from "bullmq";
import queue_config from "../configs/config.queue";
import { QueueName, type OnboardJobData, type RouteJobData } from "@trymatcha/types";

export default class QueueService {
    private queue: Queue<RouteJobData>;
    private onboard_queue: Queue<OnboardJobData>;

    constructor() {
        this.queue = new Queue(QueueName.IssueRouter, queue_config);
        this.onboard_queue = new Queue(QueueName.ProjectOnboard, queue_config);
    }

    async enqueue_project(project_id: string) {
        console.log(`[queue] enqueueing project ${project_id} for routing`);
        await this.queue.add(
            "route",
            { projectId: project_id },
            {
                jobId: `route-${project_id}`,
                removeOnComplete: true,
                removeOnFail: 100,
            },
        );
        console.log(`[queue] project ${project_id} enqueued for routing`);
    }

    /** Hand a setup session to the vm worker, which owns the E2B sandbox run. */
    async enqueue_onboarding(data: OnboardJobData) {
        console.log(
            `[queue] enqueueing onboarding session ${data.session_id} (project ${data.project_id})`,
        );
        await this.onboard_queue.add("onboard", data, {
            jobId: `onboard-${data.session_id}`,
            removeOnComplete: true,
            removeOnFail: 100,
        });
        console.log(`[queue] onboarding session ${data.session_id} enqueued`);
    }
}
