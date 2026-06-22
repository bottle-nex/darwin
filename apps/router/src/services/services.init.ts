import QueueService from "./services.queue";

export default class InitServices {
    private queue: QueueService;

    constructor() {
        this.queue = new QueueService();
    }
}
