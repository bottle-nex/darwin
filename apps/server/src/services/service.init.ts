import PublisherSystem from "../real-time/publisher.system";
import QueueService from "./services.queue";

export default class InitService {
    public publisher: PublisherSystem;
    public queue: QueueService;

    constructor() {
        this.publisher = new PublisherSystem();
        this.queue = new QueueService();
    }
}
