import PublisherSystem from "../real-time/publisher.system";
import QueueService from "./services.queue";
import NotificationQueueService from "../notifications/service.notification-queue";
import IssueOutcomeQueueService from "./service.issue_outcome_queue";

export default class InitService {
    public publisher: PublisherSystem;
    public queue: QueueService;
    public notifications: NotificationQueueService;
    public issue_outcomes: IssueOutcomeQueueService;

    constructor() {
        this.publisher = new PublisherSystem();
        this.queue = new QueueService();
        this.notifications = new NotificationQueueService();
        this.issue_outcomes = new IssueOutcomeQueueService();
    }
}
