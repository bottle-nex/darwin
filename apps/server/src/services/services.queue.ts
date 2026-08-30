import {
    type GithubImportJobData,
    type GithubIssuePayload,
    type OnboardJobData,
    type ProductDiffJobData,
    QueueName,
    type RouteJobData,
} from "@trymatcha/types";
import { Queue } from "bullmq";

import queue_config from "../configs/config.queue";

export default class QueueService {
    private queue: Queue<RouteJobData>;
    private onboard_queue: Queue<OnboardJobData>;
    private product_diff_queue: Queue<ProductDiffJobData>;
    private github_import_queue: Queue<GithubImportJobData>;

    constructor() {
        this.queue = new Queue(QueueName.IssueRouter, queue_config);
        this.onboard_queue = new Queue(QueueName.ProjectOnboard, queue_config);
        this.product_diff_queue = new Queue(QueueName.ProductDiff, queue_config);
        this.github_import_queue = new Queue(QueueName.GithubImport, queue_config);
    }
    async enqueue_project(project_id: string) {
        console.log(`[queue] enqueueing project ${project_id} for routing`);
        await this.queue.add(
            "route",
            { projectId: project_id },
            { jobId: `route-${project_id}`, removeOnComplete: true, removeOnFail: true },
        );
        console.log(`[queue] project ${project_id} enqueued for routing`);
    }

    async enqueue_onboarding(data: OnboardJobData) {
        console.log(
            `[queue] enqueueing onboarding session ${data.session_id} (project ${data.project_id})`,
        );
        await this.onboard_queue.add("onboard", data, {
            jobId: `onboard-${data.session_id}`,
            removeOnComplete: true,
            removeOnFail: true,
        });
        console.log(`[queue] onboarding session ${data.session_id} enqueued`);
    }

    async enqueue_product_diff(product_diff_id: string) {
        console.log(`[queue] enqueueing Product Diff ${product_diff_id}`);
        await this.product_diff_queue.add(
            "generate",
            { productDiffId: product_diff_id },
            { jobId: product_diff_id, removeOnComplete: true, removeOnFail: true },
        );
        console.log(`[queue] Product Diff ${product_diff_id} enqueued`);
    }

    async enqueue_github_issue(repo_id: string, payload: GithubIssuePayload) {
        console.log(`[queue] enqueueing GitHub issue ${payload.githubIssueId} (repo ${repo_id})`);
        await this.github_import_queue.add(
            "issue_opened",
            { kind: "issue_opened", repoId: repo_id, payload },
            {
                jobId: `gh-issue-${repo_id}-${payload.githubIssueId}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
        console.log(`[queue] GitHub issue ${payload.githubIssueId} enqueued`);
    }

    async enqueue_github_backfill(project_id: string, page: number) {
        console.log(`[queue] enqueueing GitHub backfill for project ${project_id} page ${page}`);
        await this.github_import_queue.add(
            "backfill",
            { kind: "backfill", projectId: project_id, page },
            {
                jobId: `gh-backfill-${project_id}-${page}`,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
        console.log(`[queue] GitHub backfill for project ${project_id} page ${page} enqueued`);
    }
}
