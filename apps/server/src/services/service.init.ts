import PublisherSystem from "../real-time/publisher.system";
import QueueService from "./services.queue";
import NotificationQueueService from "../notifications/service.notification-queue";
import IssueOutcomeQueueService from "./service.issue_outcome_queue";
import ProductDiffService from "./service.product_diff";

const PRODUCT_DIFF_SWEEP_MS = 60 * 60 * 1000;

export default class InitService {
    public publisher: PublisherSystem;
    public queue: QueueService;
    public notifications: NotificationQueueService;
    public issue_outcomes: IssueOutcomeQueueService;
    private product_diff_sweep: ReturnType<typeof setInterval>;

    constructor() {
        this.publisher = new PublisherSystem();
        this.queue = new QueueService();
        this.notifications = new NotificationQueueService();
        this.issue_outcomes = new IssueOutcomeQueueService();
        this.product_diff_sweep = setInterval(
            () => void sweep_product_diffs(this.queue),
            PRODUCT_DIFF_SWEEP_MS,
        );
        this.product_diff_sweep.unref();
        void sweep_product_diffs(this.queue);
    }

    /**
     * Stops the background sweep so a shutting-down process does not keep a timer alive.
     *
     * @example
     * server_services.close();
     */
    public close(): void {
        clearInterval(this.product_diff_sweep);
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
