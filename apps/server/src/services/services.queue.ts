import { Queue } from "bullmq";
import queue_config from "../configs/config.queue";

export interface OnboardJobData {
    session_id: string;
    project_id: string;
    repo_url: string;
    branch: string;
    installation_id: number;
}

export default class QueueService {
    private SR_QUEUE: string = "issue.route"; // server-router-queue
    private ONBOARD_QUEUE: string = "project.onboard"; // server-vm queue
    private queue: Queue;
    private onboard_queue: Queue;

    constructor() {
        this.queue = new Queue(this.SR_QUEUE, queue_config);
        this.onboard_queue = new Queue(this.ONBOARD_QUEUE, queue_config);
    }

    async enqueue_project(project_id: string) {
        await this.queue.add(
            "route",
            { project_id },
            {
                jobId: `route-${project_id}`,
                removeOnComplete: true,
                removeOnFail: 100,
            },
        );
    }

    /** Hand a setup session to the vm worker, which owns the E2B sandbox run. */
    async enqueue_onboarding(data: OnboardJobData) {
        await this.onboard_queue.add("onboard", data, {
            jobId: `onboard-${data.session_id}`,
            removeOnComplete: true,
            removeOnFail: 100,
        });
    }
}
