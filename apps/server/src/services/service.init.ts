import PublisherSystem from "../real-time/publisher.system";
import RouteQueueService from "./services.queue";

export default class InitService {
    public publisher: PublisherSystem;
    public queue: RouteQueueService;

    constructor() {
        this.publisher = new PublisherSystem();
        this.queue = new RouteQueueService();
    }
}
