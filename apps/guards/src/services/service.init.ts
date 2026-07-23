import QueueService from "./services.queue";


export class InitServices {
    public queue: QueueService;

    constructor() {
        this.queue = new QueueService();
    }
}