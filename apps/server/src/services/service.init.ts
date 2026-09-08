import { publisher, type PublisherSystem } from "@trydarwin/services";

import NotificationQueueService from "../notifications/service.notification-queue";
import { ConnectorService } from "./connectors";
import GithubImportQueueService from "./service.github_import_queue";
import IssueOutcomeQueueService from "./service.issue_outcome_queue";
import ProductDiffService from "./service.product_diff";
import QueueService from "./services.queue";

const PRODUCT_DIFF_SWEEP_MS = 60 * 60 * 1000;
const AGENT_QUESTION_SWEEP_MS = 5 * 60 * 1000;

export default class InitService {
    public publisher: PublisherSystem;
    public queue: QueueService;
    public notifications: NotificationQueueService;
    public issue_outcomes: IssueOutcomeQueueService;
    public github_imports: GithubImportQueueService;
    private product_diff_sweep: ReturnType<typeof setInterval>;
    private agent_question_sweep: ReturnType<typeof setInterval>;

    constructor() {
        this.publisher = publisher();
        this.queue = new QueueService();
        this.notifications = new NotificationQueueService();
        this.issue_outcomes = new IssueOutcomeQueueService();
        this.github_imports = new GithubImportQueueService();
        this.product_diff_sweep = setInterval(
            () => void sweep_product_diffs(this.queue),
            PRODUCT_DIFF_SWEEP_MS,
        );
        this.product_diff_sweep.unref();
        void sweep_product_diffs(this.queue);
        this.agent_question_sweep = setInterval(
            () => void sweep_agent_questions(),
            AGENT_QUESTION_SWEEP_MS,
        );
        this.agent_question_sweep.unref();
    }

    /**
     * Stops the background sweep so a shutting-down process does not keep a timer alive.
     *
     * @example
     * server_services.close();
     */
    public close(): void {
        clearInterval(this.product_diff_sweep);
        clearInterval(this.agent_question_sweep);
    }
}

async function sweep_agent_questions(): Promise<void> {
    try {
        const expired = await ConnectorService.expire_stale();
        if (expired > 0) {
            console.log(`cancelled ${expired} unanswered agent question(s)`);
        }
    } catch (error) {
        console.error("agent question sweep failed:", error);
    }
}

async function sweep_product_diffs(queue: QueueService): Promise<void> {
    try {
        const reaped = await ProductDiffService.reap_stale_generating();
        if (reaped > 0) {
            console.log(`closed out ${reaped} abandoned Product Diff run(s)`);
        }

        const orphaned = await ProductDiffService.orphaned_pending();
        for (const product_diff_id of orphaned) {
            await queue.enqueue_product_diff(product_diff_id);
        }
        if (orphaned.length > 0) {
            console.log(`queued ${orphaned.length} forgotten Product Diff(s)`);
        }
    } catch (error) {
        console.error("Product Diff sweep failed:", error);
    }
}
