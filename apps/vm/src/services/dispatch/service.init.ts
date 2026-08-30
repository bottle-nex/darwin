import QueueService from "./service.queue";

export class InitServices {
    public queue: QueueService;

    constructor() {
        this.queue = new QueueService();
    }
}
