import PublisherSystem from "../real-time/publisher.system";
import QueueService from "./services.queue";
import NotificationQueueService from "../notifications/service.notification-queue";

export default class InitService {
    public publisher: PublisherSystem;
    public queue: QueueService;
    public notifications: NotificationQueueService;

    constructor() {
        this.publisher = new PublisherSystem();
        this.queue = new QueueService();
        this.notifications = new NotificationQueueService();
    }
}
